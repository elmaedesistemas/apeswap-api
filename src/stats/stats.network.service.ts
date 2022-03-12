import {
  Injectable,
  HttpService,
  Inject,
  CACHE_MANAGER,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GeneralStatsNetworkDto } from 'src/interfaces/stats/generalStats.dto';
import { Cache } from 'cache-manager';
import { PriceService } from './price.service';
import {
  getPoolPrices,
  getDualFarmApr,
  arrayChunk,
  getTokensPrices,
  calculateMiscAmounts,
  getAllocInfo,
  getRewarderInfo,
  getLiquidityFarm,
} from './utils/stats.utils';
import { Model } from 'mongoose';
import {
  GeneralStatsNetwork,
  GeneralStatsNetworkDocument,
} from './schema/generalStatsNetwork.schema';
import { StatsService } from './stats.service';
import { createLpPairName } from 'src/utils/helpers';
import { ChainConfigService } from 'src/config/chain.configuration.service';
import { getContractNetwork } from 'src/utils/lib/web3';
import { BitqueryService } from 'src/bitquery/bitquery.service';
import { FarmStatsDto } from 'src/interfaces/stats/farm.dto';

@Injectable()
export class StatsNetworkService {
  private readonly logger = new Logger(StatsNetworkService.name);
  private readonly DUAL_FARMS_LIST_URL = this.configService.getData<string>(
    'dualFarmsListUrl',
  );
  private readonly STRAPI_URL = process.env.APESWAP_STRAPI_URL;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpService: HttpService,
    @InjectModel(GeneralStatsNetwork.name)
    private generalStatsNetworkModel: Model<GeneralStatsNetworkDocument>,
    private priceService: PriceService,
    private statsService: StatsService,
    private configService: ChainConfigService,
    private bitqueryService: BitqueryService,
  ) {}

  createGeneralStats(stats, filter) {
    return this.generalStatsNetworkModel.updateOne(
      filter,
      {
        $set: stats,
        $currentDate: {
          createdAt: true,
        },
      },
      {
        upsert: true,
        timestamps: true,
      },
    );
  }

  findGeneralStats(filter) {
    return this.generalStatsNetworkModel.findOne(filter);
  }
  updateCreatedAtStats(filter) {
    return this.generalStatsNetworkModel.updateOne(filter, {
      $currentDate: {
        createdAt: true,
      },
    });
  }

  async verifyStats(chainId) {
    const now = Date.now();
    const stats: any = await this.findGeneralStats({ chainId });
    if (!stats?.createdAt) return null;

    const lastCreatedAt = new Date(stats.createdAt).getTime();
    const diff = now - lastCreatedAt;
    const time = 300000; // 5 minutes

    if (diff > time) return null;

    return stats;
  }

  async getCalculateStatsNetwork(chainId: number) {
    const cachedValue = await this.cacheManager.get(
      `calculateStats-network-${chainId}`,
    );
    if (cachedValue) {
      this.logger.log(`Hit calculateStatsNetwork() cache for chain ${chainId}`);
      return cachedValue as GeneralStatsNetworkDto;
    }
    const infoStats = await this.verifyStats(chainId);
    if (infoStats) {
      this.logger.log(
        `Pulled Network Stats from Database Entry for chain ${chainId}`,
      );
      return infoStats;
    }
    await this.updateCreatedAtStats({ chainId });
    this.getStatsNetwork(chainId);
    const generalStats: any = await this.findGeneralStats({ chainId });
    return generalStats;
  }

  async getStatsNetwork(chainId: number): Promise<GeneralStatsNetworkDto> {
    try {
      this.logger.log(
        `Attempting to generate network stats for chain ${chainId}.`,
      );
      const masterApeContract = getContractNetwork(
        this.configService.getData<string>(`${chainId}.abi.masterApe`),
        this.configService.getData<string>(`${chainId}.contracts.masterApe`),
        chainId,
      );

      const [
        prices,
        { burntAmount, totalSupply, circulatingSupply },
      ] = await Promise.all([
        this.priceService.getTokenPricesv2(chainId),
        this.statsService.getBurnAndSupply(chainId),
      ]);
      const priceUSD =
        prices[
          this.configService.getData<string>(`${chainId}.contracts.banana`)
        ].usd;
      const generalStats: GeneralStatsNetworkDto = {
        chainId,
        bananaPrice: priceUSD,
        burntAmount,
        totalSupply,
        circulatingSupply,
        marketCap: circulatingSupply * priceUSD,
        poolsTvl: 0,
        pools: [],
        farms: [],
        incentivizedPools: [],
      };

      switch (chainId) {
        case this.configService.getData<number>('networksId.BSC'):
          const poolInfos = await this.statsService.calculatePoolInfo(
            masterApeContract,
          );

          const [
            { totalAllocPoints, rewardsPerDay },
            tokens,
            { circulatingSupply: gnanaCirculatingSupply },
          ] = await Promise.all([
            this.statsService.getAllocPointAndRewards(masterApeContract),
            this.statsService.getTokens(poolInfos),
            this.statsService.getGnanaSupply(),
          ]);

          generalStats.gnanaCirculatingSupply = gnanaCirculatingSupply;

          for (let i = 0; i < poolInfos.length; i++) {
            if (poolInfos[i].poolToken) {
              getPoolPrices(
                tokens,
                prices,
                poolInfos[i].poolToken,
                generalStats,
                i,
                poolInfos[i].allocPoints,
                totalAllocPoints,
                rewardsPerDay,
                this.configService.getData<string>(
                  `${chainId}.contracts.banana`,
                ),
              );
            }
          }

          generalStats.pools.forEach((pool) => {
            generalStats.poolsTvl += pool.stakedTvl;
          });

          try {
            await Promise.all([
              this.statsService.mappingIncetivizedPools(generalStats, prices),
              this.mappingLPVolume(
                'bsc',
                generalStats,
                this.configService.getData<number>(`${chainId}.feeLP`),
                chainId,
              ),
            ]);
          } catch (error) {}

          generalStats.incentivizedPools.forEach((pool) => {
            if (!pool.t0Address) {
              generalStats.poolsTvl += pool.stakedTvl;
            }
            delete pool.abi;
          });

          this.logger.log(`finish calculate chainID ${chainId}`);
          break;
        case this.configService.getData<number>('networksId.POLYGON'):
          generalStats.farms = await this.fetchDualFarms(prices, chainId);
          await this.mappingLPVolume(
            'matic',
            generalStats,
            this.configService.getData<number>(`${chainId}.feeLP`),
            chainId,
          );
          delete generalStats.pools;
          delete generalStats.incentivizedPools;
          delete generalStats.poolsTvl;
          this.logger.log(`finish calculate chainID ${chainId}`);
          break;

        default:
          throw new BadRequestException('Network not supported');
      }
      await this.cacheManager.set(
        `calculateStats-network-${chainId}`,
        generalStats,
        { ttl: 120 },
      );
      await this.createGeneralStats(generalStats, { chainId });
      return generalStats;
    } catch (e) {
      console.log(e);
      this.logger.error('Something went wrong calculating stats network');
      return e;
    }
  }

  async fetchDualFarms(tokenPrices, chainId: number) {
    const { data: response } = await this.httpService
      .get(this.DUAL_FARMS_LIST_URL)
      .toPromise();
    const miniChefAddress = this.configService.getData<string>(
      `${chainId}.contracts.masterApe`,
    );
    const data: FarmStatsDto[] = await Promise.all(
      response.map(async (dualFarmConfig) => {
        const {
          quoteToken,
          token1,
          miniChefRewarderToken,
          rewarderToken,
        } = getTokensPrices(dualFarmConfig, tokenPrices);

        const [
          {
            totalStaked,
            tokenAmount,
            quoteTokenAmount,
            stakeTokenPrice,
            totalInQuoteToken,
            lpTotalInQuoteToken,
          },
          { alloc, multiplier, miniChefPoolRewardPerSecond },
          { rewarderPoolRewardPerSecond },
        ] = await Promise.all([
          calculateMiscAmounts(
            this.configService.getData<any>(`${chainId}.abi.erc20`),
            dualFarmConfig,
            miniChefAddress,
            quoteToken,
            token1,
            chainId,
          ),
          getAllocInfo(
            this.configService.getData<any>(`${chainId}.abi.masterApe`),
            miniChefAddress,
            dualFarmConfig,
            miniChefRewarderToken,
            chainId,
          ),
          getRewarderInfo(dualFarmConfig, rewarderToken, chainId),
        ]);

        const apr = getDualFarmApr(
          totalStaked?.toNumber(),
          miniChefRewarderToken?.usd,
          miniChefPoolRewardPerSecond?.toString(),
          rewarderToken?.usd,
          rewarderPoolRewardPerSecond?.toString(),
        );

        return {
          poolIndex: dualFarmConfig.pid,
          name: createLpPairName(
            dualFarmConfig.stakeTokens.token0.symbol,
            dualFarmConfig.stakeTokens.token1.symbol,
          ),
          address: dualFarmConfig.stakeTokenAddress,
          t0Address: dualFarmConfig.stakeTokens.token0.address,
          t0Symbol: dualFarmConfig.stakeTokens.token0.symbol,
          t0Decimals: dualFarmConfig.stakeTokens.token0.decimals,
          p0: quoteToken.usd,
          q0: tokenAmount.toJSON(),
          t1Address: dualFarmConfig.stakeTokens.token1.address,
          t1Symbol: dualFarmConfig.stakeTokens.token1.symbol,
          t1Decimals: dualFarmConfig.stakeTokens.token1.decimals,
          p1: token1.usd,
          q1: quoteTokenAmount.toJSON(),
          price: stakeTokenPrice,
          totalSupply: totalInQuoteToken.toJSON(),
          tvl: totalStaked.toFixed(0),
          stakedTvl: lpTotalInQuoteToken.toJSON(),
          apr,
          rewardTokenPrice: miniChefRewarderToken?.usd,
          rewardTokenSymbol: miniChefRewarderToken?.symbol,
          decimals: miniChefRewarderToken?.decimals,
          rewardTokenPrice1: rewarderToken?.usd,
          rewardTokenSymbol1: rewarderToken?.symbol,
          decimals1: rewarderToken?.decimals,
          multiplier,
          poolWeight: alloc,
        };
      }),
    );
    return data;
  }

  async mappingLPVolume(
    network: string,
    pools: GeneralStatsNetworkDto,
    fee: number,
    chainId: number,
  ) {
    const addresses = pools.farms.map((f) => f.address);
    const baseCurrency = this.configService.getData<string[]>(
      `${chainId}.baseCurrency`,
    );
    const listAddresses = arrayChunk(addresses);
    let volumesList = [];
    let balanceList = [];
    for (let index = 0; index < listAddresses.length; index++) {
      const list = listAddresses[index];
      const { volumes, balance } = await this.bitqueryService.getDailyLPVolume(
        network,
        list,
        baseCurrency,
      );
      volumesList = [...volumesList, ...volumes];
      balanceList = [...balanceList, ...balance];
    }
    pools.farms.forEach((f) => {
      let aprLpReward = 0;
      let tradeAmount = 0;
      let liquidity = 0;
      try {
        const volume = volumesList.find(
          (v) =>
            v.smartContract.address.address.toLowerCase() ===
            f.address.toLowerCase(),
        );
        liquidity = getLiquidityFarm(balanceList, f);
        tradeAmount = volume?.tradeAmount ?? 0;
        aprLpReward = (((tradeAmount * fee) / 100) * 365) / +liquidity;
      } catch (error) {}
      f.lpRewards = {
        volume: tradeAmount,
        apr: aprLpReward,
        liquidity: liquidity.toFixed(0),
      };
    });
  }

  async getHomepageNetworkFeatures(): Promise<any> {
    const [farmDetails, poolDetails, lendingDetails] = [[], [], []];

    try {
      const { data: features } = await this.httpService
        .get(`${this.STRAPI_URL}/home-v-2-features`)
        .toPromise();

      const { farms: featuredFarms, pools: featuredPools } = features[0];

      const allStats = await this.getCalculateStatsNetwork(56);
      const { farms, incentivizedPools: pools } = allStats;

      featuredFarms.forEach((element) => {
        farmDetails.push(farms.find(({ poolIndex }) => element === poolIndex));
      });

      featuredPools.forEach((element) => {
        poolDetails.push(pools.find(({ id }) => element === id));
      });

      // TODO: Pull Lending Data

      return { farmDetails, poolDetails, lendingDetails };
    } catch (error) {
      this.logger.error(
        `Error when attempted to retrieve homepage featurs: ${error.message}`,
      );
    }
  }
}

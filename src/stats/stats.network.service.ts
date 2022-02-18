import {
  Injectable,
  HttpService,
  Inject,
  CACHE_MANAGER,
  Logger,
} from '@nestjs/common';
import BigNumber from 'bignumber.js';
import { InjectModel } from '@nestjs/mongoose';
import {
  GeneralStats,
  GeneralStatsNetworkDto,
} from 'src/interfaces/stats/generalStats.dto';
import { Cache } from 'cache-manager';
import { PriceService } from './price.service';
import { LP_ABI } from './utils/abi/lpAbi';
import { ERC20_ABI } from './utils/abi/erc20Abi';
import { getContract, getContractNetwork } from 'src/utils/lib/web3';
import { multicallNetwork } from 'src/utils/lib/multicall';
import {
  gBananaTreasury,
  goldenBananaAddress,
  getPoolPrices,
  masterApeContractNetwork,
  masterApeContractAddressNetwork,
  lpAbiNetwork,
  erc20AbiNetwork,
  bananaAddressNetwork,
  burnAddressNetwork,
  getDualFarmApr,
  masterApeAbiNetwork,
} from './utils/stats.utils';
import { Model } from 'mongoose';
import { SubgraphService } from './subgraph.service';
import { TvlStats } from './schema/tvlStats.schema';
import { getBalanceNumber } from 'src/utils/math';
import { MINI_COMPLEX_REWARDER_ABI } from './utils/abi/miniComplexRewarderAbi';
import configuration from 'src/config/configuration';
import {
  GeneralStatsNetwork,
  GeneralStatsNetworkDocument,
} from './schema/generalStatsNetwork.schema';

@Injectable()
export class StatsNetworkService {
  private readonly logger = new Logger(StatsNetworkService.name);
  private readonly DUAL_FARMS_LIST_URL = process.env.DUAL_FARMS_LIST_URL;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private httpService: HttpService,
    @InjectModel(GeneralStatsNetwork.name)
    private generalStatsNetworkModel: Model<GeneralStatsNetworkDocument>,
    @InjectModel(TvlStats.name)
    private subgraphService: SubgraphService,
    private priceService: PriceService,
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
      this.logger.log('Hit calculateStatsNetwork() cache');
      return cachedValue as GeneralStats;
    }
    const infoStats = await this.verifyStats(chainId);
    if (infoStats) return infoStats;
    await this.updateCreatedAtStats({ chainId });
    this.getStatsNetwork(chainId);
    const generalStats: any = await this.findGeneralStats({ chainId });
    return generalStats;
  }

  async getStatsNetwork(chainId: number): Promise<any> {
    try {
      const masterApeContract = masterApeContractNetwork(chainId);

      const [
        prices,
        { burntAmount, totalSupply, circulatingSupply },
      ] = await Promise.all([
        this.priceService.getTokenPricesv2(chainId),
        this.getBurnAndSupply(chainId),
      ]);
      const priceUSD = prices[bananaAddressNetwork(chainId)].usd;
      const generalStats: GeneralStatsNetworkDto = {
        chainId: +chainId,
        bananaPrice: priceUSD,
        burntAmount,
        totalSupply,
        circulatingSupply,
        marketCap: circulatingSupply * priceUSD,
        pools: [],
        farms: [],
      };

      switch (+chainId) {
        case configuration().networksId.BSC:
          const poolCount = parseInt(
            await masterApeContract.methods.poolLength().call(),
            10,
          );

          const poolInfos = await Promise.all(
            [...Array(poolCount).keys()].map(async (x) =>
              this.getPoolInfoNetwork(masterApeContract, x, chainId),
            ),
          );

          const [
            totalAllocPoints,
            rewardsPerDay,
            tokens,
            { circulatingSupply: gnanaCirculatingSupply },
          ] = await Promise.all([
            masterApeContract.methods.totalAllocPoint().call(),
            this.getRewardPerDay(masterApeContract, +chainId),
            this.getTokensNetwork(poolInfos, chainId),
            this.getGnanaSupply(),
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
                chainId,
              );
            }
          }

          this.logger.log(`finish calculate chainID ${chainId}`);
          break;
        case configuration().networksId.POLYGON:
          const dualFarms = await this.fetchDualFarms(prices, chainId);
          generalStats.farms = dualFarms;
          this.logger.log(`finish calculate chainID ${chainId}`);
          break;

        default:
          return {
            chainId,
            message: 'Network not supported',
          };
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

  async getRewardPerDay(masterApeContract, chainId: number) {
    switch (chainId) {
      case 56:
        return (
          (await (((await masterApeContract.methods.cakePerBlock().call()) /
            1e18) *
            86400)) / 3
        );
      case 137:
        return await masterApeContract.methods.bananaPerSecond().call();

      default:
        return 0;
    }
  }

  async getPoolInfoNetwork(masterApeContract, poolIndex, chainId: number) {
    let lpToken;
    const poolInfo = await masterApeContract.methods.poolInfo(poolIndex).call();
    lpToken = poolInfo.lpToken;

    if (!lpToken) {
      lpToken = await masterApeContract.methods.lpToken(poolIndex).call();
    }
    let poolToken;
    try {
      if ([0, 75, 112, 162].includes(poolIndex)) {
        poolToken = await this.getTokenInfoNetwork(
          lpToken,
          masterApeContractAddressNetwork(chainId),
          chainId,
        );
      } else {
        poolToken = await this.getLpInfoNetwork(
          lpToken,
          masterApeContractAddressNetwork(chainId),
          chainId,
        );
      }
    } catch (error) {
      console.log('un error');
    }

    return {
      address: lpToken,
      allocPoints: poolInfo.allocPoint ?? 1,
      poolToken,
      poolIndex,
      lastRewardBlock: poolInfo.lastRewardBlock,
    };
  }

  async getLpInfoNetwork(tokenAddress, stakingAddress, chainId) {
    try {
      const [reserves, decimals, token0, token1] = await multicallNetwork(
        lpAbiNetwork(chainId),
        [
          {
            address: tokenAddress,
            name: 'getReserves',
          },
          {
            address: tokenAddress,
            name: 'decimals',
          },
          {
            address: tokenAddress,
            name: 'token0',
          },
          {
            address: tokenAddress,
            name: 'token1',
          },
        ],
        chainId,
      );

      let [totalSupply, staked] = await multicallNetwork(
        lpAbiNetwork(chainId),
        [
          {
            address: tokenAddress,
            name: 'totalSupply',
          },
          {
            address: tokenAddress,
            name: 'balanceOf',
            params: [stakingAddress],
          },
        ],
        chainId,
      );

      totalSupply /= 10 ** decimals[0];
      staked /= 10 ** decimals[0];

      const q0 = reserves._reserve0;
      const q1 = reserves._reserve1;
      return {
        address: tokenAddress,
        token0: token0[0],
        q0,
        token1: token1[0],
        q1,
        totalSupply,
        stakingAddress,
        staked,
        decimals: decimals[0],
        tokens: [token0[0], token1[0]],
      };
    } catch (error) {
      console.log('inusual ', tokenAddress);
      //console.log(error);
    }
  }

  async getTokenInfoNetwork(tokenAddress, stakingAddress, chainId) {
    if (tokenAddress == '0x0000000000000000000000000000000000000000') {
      return {
        address: tokenAddress,
        name: 'Binance',
        symbol: 'BNB',
        totalSupply: 1e8,
        decimals: 18,
        staked: 0,
        tokens: [tokenAddress],
      };
    }

    // HOTFIX for Rocket token (Rocket contract currently incompatible with ERC20_ABI)
    if (tokenAddress == '0x3bA5aee47Bb7eAE40Eb3D06124a74Eb89Da8ffd2') {
      const contract = getContract(
        LP_ABI,
        '0x93fa1A6357De25031311f784342c33A26Cb1C87A', // ROCKET-BNB LP pair address
      );
      const reserves = await contract.methods.getReserves().call();
      const q0 = reserves._reserve0 / 10 ** 18;

      return {
        address: tokenAddress,
        name: 'Rocket',
        symbol: 'ROCKET',
        totalSupply: 1000000000,
        decimals: 18,
        staked: q0,
        tokens: [tokenAddress],
      };
    }

    const [
      name,
      symbol,
      totalSupply,
      decimals,
      staked,
    ] = await multicallNetwork(
      erc20AbiNetwork(chainId),
      [
        {
          address: tokenAddress,
          name: 'name',
        },
        {
          address: tokenAddress,
          name: 'symbol',
        },
        {
          address: tokenAddress,
          name: 'totalSupply',
        },
        {
          address: tokenAddress,
          name: 'decimals',
        },
        {
          address: tokenAddress,
          name: 'balanceOf',
          params: [stakingAddress],
        },
      ],
      chainId,
    );

    return {
      address: tokenAddress,
      name: name[0],
      symbol: symbol[0],
      totalSupply: totalSupply[0],
      decimals: decimals[0],
      staked: staked[0] / 10 ** decimals[0],
      tokens: [tokenAddress],
    };
  }

  async getBurnAndSupply(chainId: number) {
    const bananaContract = getContractNetwork(
      erc20AbiNetwork(chainId),
      bananaAddressNetwork(chainId),
      chainId,
    );

    const decimals = await bananaContract.methods.decimals().call();

    const [burned, supply] = await Promise.all([
      bananaContract.methods.balanceOf(burnAddressNetwork(chainId)).call(),
      bananaContract.methods.totalSupply().call(),
    ]);

    const burntAmount = burned / 10 ** decimals;
    const totalSupply = supply / 10 ** decimals;
    const circulatingSupply = totalSupply - burntAmount;

    return {
      burntAmount,
      totalSupply,
      circulatingSupply,
    };
  }

  async getGnanaSupply() {
    const gnanaContract = getContract(ERC20_ABI, goldenBananaAddress());

    const decimals = await gnanaContract.methods.decimals().call();

    const [treasury, supply] = await Promise.all([
      gnanaContract.methods.balanceOf(gBananaTreasury()).call(),
      gnanaContract.methods.totalSupply().call(),
    ]);

    const treasuryAmount = treasury / 10 ** decimals;
    const totalSupply = supply / 10 ** decimals;
    const circulatingSupply = totalSupply - treasuryAmount;

    return {
      circulatingSupply,
    };
  }

  async getTokensNetwork(poolInfos, chainId) {
    const tokens = {};
    // eslint-disable-next-line prefer-spread
    const tokenAddresses = [].concat.apply(
      [],
      poolInfos.filter((x) => x.poolToken).map((x) => x.poolToken.tokens),
    );

    await Promise.all(
      tokenAddresses.map(async (address) => {
        tokens[address] = await this.getTokenInfoNetwork(
          address,
          masterApeContractAddressNetwork(chainId),
          chainId,
        );
      }),
    );

    return tokens;
  }

  async fetchDualFarms(tokenPrices, chainId: number) {
    const { data: response } = await this.httpService
      .get(this.DUAL_FARMS_LIST_URL)
      .toPromise();
    const miniChefAddress = masterApeContractAddressNetwork(chainId);
    const data: any[] = await Promise.all(
      response.map(async (dualFarmConfig) => {
        const lpAdress = dualFarmConfig.stakeTokenAddress;
        const quoteToken =
          tokenPrices[dualFarmConfig.stakeTokens.token0.address.toLowerCase()];
        const token1 =
          tokenPrices[dualFarmConfig.stakeTokens.token1.address.toLowerCase()];
        const miniChefRewarderToken =
          tokenPrices[dualFarmConfig.rewardTokens.token0.address.toLowerCase()];
        const rewarderToken =
          tokenPrices[dualFarmConfig.rewardTokens.token1.address.toLowerCase()];

        const calls = [
          // Balance of token in the LP contract
          {
            address: dualFarmConfig.stakeTokens.token0.address,
            name: 'balanceOf',
            params: [lpAdress],
          },
          // Balance of quote token on LP contract
          {
            address: dualFarmConfig.stakeTokens.token1.address,
            name: 'balanceOf',
            params: [lpAdress],
          },
          // Balance of LP tokens in the master chef contract
          {
            address: lpAdress,
            name: 'balanceOf',
            params: [miniChefAddress],
          },
          // Total supply of LP tokens
          {
            address: lpAdress,
            name: 'totalSupply',
          },
        ];

        const [
          quoteTokenBlanceLP,
          tokenBalanceLP,
          lpTokenBalanceMC,
          lpTotalSupply,
        ] = await multicallNetwork(erc20AbiNetwork(chainId), calls, chainId);

        // Ratio in % a LP tokens that are in staking, vs the total number in circulation
        const lpTokenRatio = new BigNumber(lpTokenBalanceMC).div(
          new BigNumber(lpTotalSupply),
        );

        // Total value in staking in quote token value
        const lpTotalInQuoteToken = new BigNumber(quoteTokenBlanceLP)
          .div(new BigNumber(10).pow(quoteToken?.decimals))
          .times(new BigNumber(2))
          .times(lpTokenRatio);

        // Total value in pool in quote token value
        const totalInQuoteToken = new BigNumber(quoteTokenBlanceLP)
          .div(new BigNumber(10).pow(quoteToken?.decimals))
          .times(new BigNumber(2));

        // Amount of token in the LP that are considered staking (i.e amount of token * lp ratio)
        const tokenAmount = new BigNumber(tokenBalanceLP)
          .div(new BigNumber(10).pow(token1?.decimals))
          .times(lpTokenRatio);
        const quoteTokenAmount = new BigNumber(quoteTokenBlanceLP)
          .div(new BigNumber(10).pow(quoteToken?.decimals))
          .times(lpTokenRatio);

        let alloc = null;
        let multiplier = 'unset';
        let miniChefPoolRewardPerSecond = null;
        try {
          const [
            info,
            totalAllocPoint,
            miniChefRewardsPerSecond,
          ] = await multicallNetwork(
            masterApeAbiNetwork(chainId),
            [
              {
                address: miniChefAddress,
                name: 'poolInfo',
                params: [dualFarmConfig.pid],
              },
              {
                address: miniChefAddress,
                name: 'totalAllocPoint',
              },
              {
                address: miniChefAddress,
                name: 'bananaPerSecond',
              },
            ],
            chainId,
          );
          const allocPoint = new BigNumber(info.allocPoint._hex);
          const poolWeight = allocPoint.div(new BigNumber(totalAllocPoint));
          miniChefPoolRewardPerSecond = getBalanceNumber(
            poolWeight.times(miniChefRewardsPerSecond),
            miniChefRewarderToken?.decimals,
          );
          alloc = poolWeight.toJSON();
          multiplier = `${allocPoint.div(100).toString()}X`;
          // eslint-disable-next-line no-empty
        } catch (error) {
          console.warn('Error fetching farm', error, dualFarmConfig);
        }

        let rewarderTotalAlloc = null;
        let rewarderInfo = null;
        let rewardsPerSecond = null;

        if (
          dualFarmConfig.rewarderAddress ===
          '0x1F234B1b83e21Cb5e2b99b4E498fe70Ef2d6e3bf'
        ) {
          // Temporary until we integrate the subgraph to the frontend
          rewarderTotalAlloc = 10000;
          const multiReturn = await multicallNetwork(
            MINI_COMPLEX_REWARDER_ABI,
            [
              {
                address: dualFarmConfig.rewarderAddress,
                name: 'poolInfo',
                params: [dualFarmConfig.pid],
              },
              {
                address: dualFarmConfig.rewarderAddress,
                name: 'rewardPerSecond',
              },
            ],
            chainId,
          );
          rewarderInfo = multiReturn[0];
          rewardsPerSecond = multiReturn[1];
        } else {
          const multiReturn = await multicallNetwork(
            MINI_COMPLEX_REWARDER_ABI,
            [
              {
                address: dualFarmConfig.rewarderAddress,
                name: 'poolInfo',
                params: [dualFarmConfig.pid],
              },
              {
                address: dualFarmConfig.rewarderAddress,
                name: 'rewardPerSecond',
              },
              {
                address: dualFarmConfig.rewarderAddress,
                name: 'totalAllocPoint',
              },
            ],
            chainId,
          );
          rewarderInfo = multiReturn[0];
          rewardsPerSecond = multiReturn[1];
          rewarderTotalAlloc = multiReturn[2];
        }

        const totalStaked = quoteTokenAmount
          .times(new BigNumber(2))
          .times(quoteToken?.usd);
        const totalValueInLp = new BigNumber(quoteTokenBlanceLP)
          .div(new BigNumber(10).pow(quoteToken?.decimals))
          .times(new BigNumber(2))
          .times(quoteToken?.usd);
        const stakeTokenPrice = totalValueInLp
          .div(new BigNumber(getBalanceNumber(lpTotalSupply)))
          .toNumber();

        const rewarderAllocPoint = new BigNumber(
          rewarderInfo?.allocPoint?._hex,
        );
        const rewarderPoolWeight = rewarderAllocPoint.div(
          new BigNumber(rewarderTotalAlloc),
        );
        const rewarderPoolRewardPerSecond = getBalanceNumber(
          rewarderPoolWeight.times(rewardsPerSecond),
          rewarderToken?.decimals,
        );
        const apr = getDualFarmApr(
          totalStaked?.toNumber(),
          miniChefRewarderToken?.usd,
          miniChefPoolRewardPerSecond?.toString(),
          rewarderToken?.usd,
          rewarderPoolRewardPerSecond?.toString(),
        );

        return {
          ...dualFarmConfig,
          tokenAmount: tokenAmount.toJSON(),
          totalStaked: totalStaked.toFixed(0),
          quoteTokenAmount: quoteTokenAmount.toJSON(),
          totalInQuoteToken: totalInQuoteToken.toJSON(),
          lpTotalInQuoteToken: lpTotalInQuoteToken.toJSON(),
          tokenPriceVsQuote: quoteTokenAmount.div(tokenAmount).toJSON(),
          stakeTokenPrice,
          rewardToken0Price: miniChefRewarderToken?.usd,
          rewardToken1Price: rewarderToken?.usd,
          poolWeight: alloc,
          multiplier,
          apr,
        };
      }),
    );
    return data;
  }
}

import { Injectable, HttpService, Logger } from '@nestjs/common';
import dayjs from 'dayjs';
import { ChainConfigService } from 'src/config/chain.configuration.service';
import { MainNetworkPriceDto } from 'src/interfaces/stats/misc.dto';
import {
  getPercentChange,
  getTimestampsForChanges,
  parseData,
} from 'src/utils/helpers';
import {
  dayData,
  pairsQuery,
  liquidityQuery,
  allPricesQuery,
  swapsData,
  usersPairDayData,
  userPairDayData,
  polygonLiquidityQuery,
  MAIN_NETWORK_PRICE,
  GET_BLOCKS,
  PAIRS_BULK,
  PAIRS_HISTORICAL_BULK,
  PAIR_DATA,
  topTokensQuery,
} from './utils/subgraph.queries';

@Injectable()
export class SubgraphService {
  logger = new Logger(SubgraphService.name);
  graphUrl = process.env.GRAPH_URL;
  polygonGraphUrl = process.env.POLYGON_GRAPH_URL;

  constructor(
    private httpService: HttpService,
    private configService: ChainConfigService,
  ) {}

  async getVolumeData(): Promise<any> {
    const { data } = await this.querySubraph(liquidityQuery);
    const volumeData = {
      liquidity: parseFloat(data.uniswapFactory.totalLiquidityUSD),
      totalVolume: parseFloat(data.uniswapFactory.totalVolumeUSD),
    };
    return volumeData;
  }

  async getLiquidityPolygonData(): Promise<any> {
    const { data } = await this.queryPolygonSubraph(polygonLiquidityQuery);
    const volumeData = {
      liquidity: parseFloat(data.uniswapFactory.totalLiquidityUSD),
      totalVolume: parseFloat(data.uniswapFactory.totalVolumeUSD),
    };
    return volumeData;
  }

  async getPairsData(): Promise<any> {
    const { data } = await this.querySubraph(pairsQuery);
    return data;
  }

  async getTopTokensData(chainId: number, block: string): Promise<any> {
    if (chainId === 56) {
      const { data } = await this.querySubraph(topTokensQuery(block));
      return data;
    } else if (chainId === 137) {
      const { data } = await this.queryPolygonSubraph(topTokensQuery(block));
      return data;
    }
  }

  async getDayData(startTimestamp: number, endTimestamp: number): Promise<any> {
    const { data } = await this.querySubraph(
      dayData(0, startTimestamp, endTimestamp),
    );
    return data;
  }

  async getTodayData(): Promise<any> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 2);
    const yTimestamp = Math.round(yesterday.getTime() / 1000);
    const nowTimestamp = Math.round(new Date().getTime() / 1000);
    const { apeswapDayDatas } = await this.getDayData(yTimestamp, nowTimestamp);
    return apeswapDayDatas[1] || apeswapDayDatas[0];
  }

  async getPairSwapData(
    pair: string,
    startTime: number,
    endTime: number,
    first = 1000,
    skip = 0,
  ): Promise<any> {
    const query = swapsData(pair, startTime, endTime, first, skip);
    const { data } = await this.querySubraph(query);
    let result = data.swaps;
    if (result?.length === 1000) {
      // Paginate
      const swaps = await this.getPairSwapData(
        pair,
        startTime,
        endTime,
        first,
        first + skip,
      );
      result = [...result, ...swaps];
      this.logger.log(`swapsData result length: ${result.length}`);
    }
    return result;
  }

  async getUserDailyPairData(
    pair: string,
    startTime: number,
    endTime: number,
    first = 1000,
    skip = 0,
  ): Promise<any> {
    const query = usersPairDayData(pair, startTime, endTime, first, skip);
    this.logger.log(query);
    const res = await this.querySubraph(query);
    let result = res.data.userPairDayDatas;
    if (result?.length === 1000) {
      // Paginate
      const userPairDayDatas = await this.getUserDailyPairData(
        pair,
        startTime,
        endTime,
        first,
        first + skip,
      );
      result = [...result, ...userPairDayDatas];
      this.logger.log(`getUserDailyPairData result length: ${result.length}`);
    }
    return result;
  }

  async getUserCurrentPairData(
    pair: string,
    startTime: number,
    endTime: number,
    address: string,
  ): Promise<any> {
    const query = userPairDayData(pair, startTime, endTime, address);
    this.logger.log(query);
    const res = await this.querySubraph(query);
    const result = res.data.userPairDayDatas;
    return result;
  }

  async getDailySummary() {
    const [dailyData, tvlData, pairData] = await Promise.all([
      this.getTodayData(),
      this.getVolumeData(),
      this.getPairsData(),
    ]);
    return {
      volume: dailyData.dailyVolumeUSD,
      tvl: tvlData.tvl,
      pairs: pairData.pairs,
    };
  }

  async getAllPriceData() {
    const { data } = await this.querySubraph(allPricesQuery);
    return data.tokens;
  }

  async querySubraph(query): Promise<any> {
    const { data } = await this.httpService
      .post(this.graphUrl, { query })
      .toPromise();
    return data;
  }

  async queryPolygonSubraph(query): Promise<any> {
    const { data } = await this.httpService
      .post(this.polygonGraphUrl, { query })
      .toPromise();
    return data;
  }

  async executeQuerySubraph(url, query): Promise<any> {
    try {
      const { data } = await this.httpService.post(url, { query }).toPromise();
      return data;
    } catch (error) {
      console.log('error');
      console.log(error);
    }
  }

  async getMainNetworkPrice(chainId): Promise <MainNetworkPriceDto> {
    const utcCurrentTime = dayjs();
    const utcOneDayBack = utcCurrentTime
      .subtract(1, 'day')
      .startOf('minute')
      .unix();
    let price = 0;
    let priceOneDay = 0;
    let priceChange = 0;

    try {
      const url = this.configService.getData<string>(
        `${chainId}.subgraph.blocks`,
      );
      const oneDayBlock = await this.getBlocksFromTimestamps(
        [utcOneDayBack],
        chainId,
      );
      const result = await this.executeQuerySubraph(url, MAIN_NETWORK_PRICE());
      const resultOneDay = await this.executeQuerySubraph(
        url,
        MAIN_NETWORK_PRICE(oneDayBlock[0].number || null),
      );
      const currentPrice = result?.data?.bundles[0]?.ethPrice;
      const oneDayBackPrice = resultOneDay?.data?.bundles[0]?.ethPrice;
      priceChange = getPercentChange(currentPrice, oneDayBackPrice);
      price = currentPrice;
      priceOneDay = oneDayBackPrice;
    } catch (e) {
      console.log(e);
    }

    return { price, priceOneDay, priceChange}
  }

  async getBulkPairData(pairList, chainId) {
    const { price } = await this.getMainNetworkPrice(chainId);
    const { oneDay, twoDay, oneWeek } = getTimestampsForChanges();
    const [
      { number: b1 },
      { number: b2 },
      { number: bWeek },
    ] = await this.getBlocksFromTimestamps([oneDay, twoDay, oneWeek], chainId);
    try {
      const url = this.configService.getData<string>(
        `${chainId}.subgraph.principal`,
      );
      
      const [ current, { oneDayData, twoDayData, oneWeekData }] = await Promise.all([
        this.executeQuerySubraph(url, PAIRS_BULK(pairList)),
        this.getDaysData(b1, b2, bWeek, pairList, url),
      ]);

      const pairData = await Promise.all(
        current &&
          current.data.pairs.map(async (pair) => {
            let data = pair;
            data.smartContract = {
              address: { address: pair.id },
            };
            let oneDayHistory = oneDayData?.[pair.id];
            if (!oneDayHistory) {
              const newData = await this.getPairHistory(url, pair, b1);
              oneDayHistory = newData.data.pairs[0];
            }
            let twoDayHistory = twoDayData?.[pair.id];
            if (!twoDayHistory) {
              const newData = await this.getPairHistory(url, pair, b2);
              twoDayHistory = newData.data.pairs[0];
            }
            let oneWeekHistory = oneWeekData?.[pair.id];
            if (!oneWeekHistory) {
              const newData = await this.getPairHistory(url, pair, bWeek);
              oneWeekHistory = newData.data.pairs[0];
            }
            data = parseData(
              data,
              oneDayHistory,
              twoDayHistory,
              oneWeekHistory,
              price,
              b1,
            );
            return data;
          }),
      );
      return pairData;
    } catch (e) {
      console.log(e);
    }
  }

  async getDaysData(b1, b2, bWeek, pairList, url) {
    const [oneDayResult, twoDayResult, oneWeekResult] = await Promise.all(
      [b1, b2, bWeek].map(async (block) => {
        const result = await this.executeQuerySubraph(
          url,
          PAIRS_HISTORICAL_BULK(block, pairList),
        );
        return result;
      }),
    );
    const oneDayData = oneDayResult?.data?.pairs.reduce((obj, cur) => {
      return { ...obj, [cur.id]: cur };
    }, {});

    const twoDayData = twoDayResult?.data?.pairs.reduce((obj, cur) => {
      return { ...obj, [cur.id]: cur };
    }, {});

    const oneWeekData = oneWeekResult?.data?.pairs.reduce((obj, cur) => {
      return { ...obj, [cur.id]: cur };
    }, {});

    return { oneDayData, twoDayData, oneWeekData }
  }
  async getPairHistory(url, pair, time) {
    return await this.executeQuerySubraph(
      url,
      PAIR_DATA(pair.id, time),
    );
  }

  async getBlocksFromTimestamps(timestamps, chainId, skipCount = 500) {
    if (timestamps?.length === 0) return [];

    const fetchedData = await this.splitQuery(
      GET_BLOCKS,
      chainId,
      [],
      timestamps,
      skipCount,
    );

    const blocks = [];
    if (fetchedData) {
      for (const t in fetchedData) {
        if (fetchedData[t].length > 0) {
          blocks.push({
            timestamp: t.split('t')[1],
            number: fetchedData[t][0]['number'],
          });
        }
      }
    }
    return blocks;
  }

  async splitQuery(query, chainId, vars, list, skipCount = 100) {
    let fetchedData = {};
    let allFound = false;
    let skip = 0;

    const url = this.configService.getData<string>(
      `${chainId}.subgraph.blocks`,
    );

    while (!allFound) {
      let end = list.length;
      if (skip + skipCount < list.length) {
        end = skip + skipCount;
      }
      const sliced = list.slice(skip, end);
      const result = await this.executeQuerySubraph(
        url,
        query(...vars, sliced),
      );

      fetchedData = {
        ...fetchedData,
        ...result.data,
      };
      if (
        Object.keys(result.data).length < skipCount ||
        skip + skipCount > list.length
      ) {
        allFound = true;
      } else {
        skip += skipCount;
      }
    }

    return fetchedData;
  }
}

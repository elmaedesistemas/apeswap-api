import {
  CACHE_MANAGER,
  HttpService,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  queryCandleData,
  queryLPVolume,
  queryPairInformation,
  queryPoolBalances,
  queryTokenInformation,
  queryTokenPairsLP,
  queryWalletBalances,
  QUOTE_CURRENCY_BSC,
} from './bitquery.queries';
import { PairInformationDto } from './dto/pairInformation.dto';
import {
  TokenInformationDto,
  TokenLPInformationDto,
} from './dto/tokenInformation.dto';
import {
  calculatePrice,
  getQuoteCurrencies,
  getQuoteCurrency,
} from './utils/helper.bitquery';
import { CandleOptionsDto } from './dto/candle.dto';
import { ChainConfigService } from 'src/config/chain.configuration.service';
import { BalanceDto, WalletBalanceDto } from './dto/walletBalance.dto';

@Injectable()
export class BitqueryService {
  private readonly logger = new Logger(BitqueryService.name);
  private readonly url: string;
  private readonly apiKey: string;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(HttpService)
    private readonly httpService: HttpService,
    private configService: ChainConfigService,
  ) {
    this.url = this.configService.getData<string>(`bitquery.url`);
    this.apiKey = this.configService.getData<string>(`bitquery.apikey`);
  }

  async getPairInformation(address: string, network: string) {
    const cachedValue = await this.cacheManager.get(`pair-${address}`);
    if (cachedValue) {
      this.logger.log('Hit getPairInformation() cache');
      return cachedValue;
    }
    this.logger.log('Hit new calculate pair information');
    return await this.calculatePairInformation(address, network);
  }

  async calculatePairInformation(addressLP: string, network: string) {
    const pairInfo: PairInformationDto = {
      addressLP,
    };
    const info = await this.calculatePairData(network, [addressLP]);
    const data = {
      ...pairInfo,
      ...info[0],
    };

    await this.cacheManager.set(`pair-${addressLP}`, data, { ttl: 120 });
    return data;
  }

  async getTokenInformation(address: string, network: string) {
    const cachedValue: TokenInformationDto = await this.cacheManager.get(
      `token-${address}`,
    );
    if (cachedValue) {
      this.logger.log(`Hit token information(${address}, ${network}) cache`);
      return cachedValue;
    }
    this.logger.log(
      `Hit new calculate token information(${address}, ${network})`,
    );
    return await this.calculateTokenInformation(address, network);
  }

  async calculateTokenInformation(address: string, network: string) {
    const tokenInfo: TokenInformationDto = {
      address: address,
    };

    const { transfers, dexTrades, quote } = await this.calculateLastPrice(
      network,
      address,
    );

    if (transfers && transfers.length > 0) {
      tokenInfo.totalSupply = transfers[0].minted;
      tokenInfo.burntAmount = transfers[0].burned;
      tokenInfo.circulatingSupply = transfers[0].minted - transfers[0].burned;

      tokenInfo.name = transfers[0].currency.name;
      tokenInfo.symbol = transfers[0].currency.symbol;
    }

    if (dexTrades && dexTrades.length > 0) {
      tokenInfo.quote = quote;
      tokenInfo.tokenPrice = dexTrades[0].quotePrice;
      if (!tokenInfo.quote.stable) {
        tokenInfo.tokenPrice *= await this.getQuoteTokenPrice(
          network,
          tokenInfo.quote.address,
        );
      }
      tokenInfo.marketCap =
        (transfers[0].minted - transfers[0].burned) * tokenInfo.tokenPrice;
    }
    await this.cacheManager.set(`token-${address}`, tokenInfo, { ttl: 120 });

    return tokenInfo;
  }

  async getTokenPairLPInformation(
    address: string,
    network: string,
  ): Promise<TokenLPInformationDto> {
    const cachedValue: TokenLPInformationDto = await this.cacheManager.get(
      `token-lp-${address}`,
    );
    if (cachedValue) {
      this.logger.log('Hit token LP information() cache');
      return cachedValue;
    }
    this.logger.log('Hit new calculate token LP information');
    return await this.getTokenPairLP(network, address);
  }

  async getTokenPairLP(
    network: string,
    address: string,
  ): Promise<TokenLPInformationDto> {
    const data: TokenLPInformationDto = {
      address,
      lp: [],
    };
    const {
      data: {
        ethereum: { dexTrades },
      },
    } = await this.queryBitquery(queryTokenPairsLP(network, address));
    if (!dexTrades || dexTrades.length === 0) return data;

    const addresses = dexTrades.map((d) => d.smartContract.address.address);
    data.lp = await this.calculatePairData(network, addresses);
    await this.cacheManager.set(`token-lp-${address}`, data, { ttl: 120 });

    return data;
  }

  async calculatePairData(network: string, addresses: string[]) {
    const limit = 10 * addresses.length;
    const {
      data: {
        ethereum: { smartContractCalls },
      },
    } = await this.queryBitquery(queryPairInformation(network, limit), {
      address: addresses,
    });
    const info = [];
    if (smartContractCalls) {
      for (let index = 0; index < addresses.length; index++) {
        const data = {
          quote: null,
          base: null,
          target: null,
          ticker_id: null,
          liquidity: 0,
        };
        const address = addresses[index];
        const tokenFilters = smartContractCalls.filter(
          (f) =>
            f.smartContract?.contractType === 'Token' &&
            address === f.caller.address,
        );

        data.quote = getQuoteCurrency(network);
        const {
          data: {
            ethereum: { address: balances, base, target },
          },
        } = await this.queryBitquery(
          queryPoolBalances(
            address,
            network,
            tokenFilters[0].smartContract.address.address,
            tokenFilters[1].smartContract.address.address,
            data.quote.address,
          ),
        );
        data.base = {
          name: balances[0].balances[0].currency.symbol,
          address: balances[0].balances[0].currency.address,
          pooled_token: balances[0].balances[0].value,
        };
        data.target = {
          name: balances[0].balances[1].currency.symbol,
          address: balances[0].balances[1].currency.address,
          pooled_token: balances[0].balances[1].value,
        };
        data.ticker_id = `${data.base.name}_${data.target.name}`;
        const { basePrice, targetPrice } = calculatePrice(
          data,
          base,
          target,
          tokenFilters[0].smartContract.address.address,
        );
        data.base.price = basePrice;
        data.target.price = targetPrice;
        data.liquidity = data.base.pooled_token * 2 * data.base.price;
        info.push(data);
      }
    }
    info.sort(function (a, b) {
      if (a.liquidity < b.liquidity) {
        return 1;
      }
      if (a.liquidity > b.liquidity) {
        return -1;
      }
      return 0;
    });
    return info;
  }
  async getQuoteTokenPrice(network: string, quoteAddress: string) {
    const cachedValue: TokenInformationDto = await this.cacheManager.get(
      `token-${quoteAddress}`,
    );
    if (cachedValue) {
      this.logger.log('Hit token information() cache');
      return cachedValue.tokenPrice;
    }
    const { dexTrades: dex } = await this.getQueryTokenInformation(
      network,
      quoteAddress,
      getQuoteCurrency(network).address,
    );
    return dex[0].quotePrice;
  }

  async calculateLastPrice(network: string, address: string) {
    let transfers, dexTrades, quote;
    const quotes = getQuoteCurrencies(network);
    for (let index = 0; index < Object.keys(quotes).length; index++) {
      const element = Object.values(quotes)[index];
      const {
        transfers: trans,
        dexTrades: dex,
      } = await this.getQueryTokenInformation(
        network,
        address,
        element.address,
      );
      if (dex && dex.length > 0) {
        const now = new Date().getTime();
        const time = dex[0].block.timestamp.unixtime;
        const diff = (now - time * 1000) / 1000 / 60;
        if (diff < 7200) {
          quote = element;
          transfers = trans;
          dexTrades = dex;
          break;
        }
      }
    }
    return { transfers, dexTrades, quote };
  }

  async getQueryTokenInformation(
    network: string,
    tokenAddress: string,
    quoteAddress: string,
  ) {
    const {
      data: {
        ethereum: { transfers, dexTrades },
      },
    } = await this.queryBitquery(
      queryTokenInformation(network, tokenAddress, quoteAddress),
    );

    return { transfers, dexTrades };
  }

  async getCandleToken(address: string, candleOptions: CandleOptionsDto) {
    const network = 'bsc';

    try {
      const {
        data: {
          ethereum: { dexTrades },
        },
      } = await this.queryBitquery(
        queryCandleData(
          address,
          QUOTE_CURRENCY_BSC.BUSD.address,
          network,
          candleOptions,
        ),
      );
      return dexTrades;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  async getDailyLPVolume(
    network: string,
    address: string[],
    baseCurrency: string[],
  ) {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const {
      data: {
        ethereum: { dexTrades, address: listBaseCurrency },
      },
    } = await this.queryBitquery(
      queryLPVolume(network, yesterday.toISOString(), today.toISOString()),
      { address, baseCurrency },
    );
    return {
      volumes: dexTrades,
      balance: listBaseCurrency,
    };
  }

  async getWalletBalances(network: string, address: string) {
    const info: WalletBalanceDto = {
      address,
      balances: [],
    };
    const {
      data: {
        ethereum: { address: balances },
      },
    } = await this.queryBitquery(queryWalletBalances(network, address));

    const b: BalanceDto[] = await Promise.all(
      balances[0].balances.map(async (b) => {
        let price = 0;
        try {
          const token = await this.getTokenInformation(
            b.currency.address,
            network,
          );
          price = token.tokenPrice;
        } catch (error) {}
        return {
          ...b.currency,
          value: b.value,
          price,
        };
      }),
    );
    info.balances = b;
    info.balances.sort(function (a, b) {
      if (a.name > b.name) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 0;
    });
    return info;
  }
  // bitquery
  async queryBitquery(query, variables = null): Promise<any> {
    const { data } = await this.httpService
      .post(
        this.url,
        { query, variables },
        { headers: { 'x-api-key': this.apiKey } },
      )
      .toPromise()
      .catch((e) => {
        console.log(e);
        return e.response;
      });
    return data;
  }
}

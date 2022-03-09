/*
  TODO
  - Add basic error handling
*/

import {
  Inject,
  Injectable,
  Logger,
  HttpService,
  CACHE_MANAGER,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cache } from 'cache-manager';
import { Model } from 'mongoose';
import { SubgraphService } from '../stats/subgraph.service';
import { ChainConfigService } from 'src/config/chain.configuration.service';
import { TokenList, TokenListDocument } from './schema/tokenList.schema';
import { getWeb3 } from 'src/utils/lib/web3';
import { Token } from 'src/interfaces/tokens/token.dto';

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private readonly TOKEN_LIST_URL = this.configService.getData<string>(
    'tokenListUrl',
  );

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @InjectModel(TokenList.name)
    private tokenListModel: Model<TokenListDocument>,
    private subgraphService: SubgraphService,
    private httpService: HttpService,
    private configService: ChainConfigService,
  ) {}

  bscWeb3 = getWeb3(56);
  polygonWeb3 = getWeb3(137);

  /*
    FUNCTIONS CALLED BY THE CONTROLLER
  */

  // Called at /tokens
  async getAllTokens(): Promise<TokenList[]> {
    const tokenLists: TokenList[] = await this.findAllTokenLists();
    return tokenLists;
  }

  // Called at /tokens/:type
  async getTokensFromType(type: string): Promise<TokenList> {
    // Check 1: Cache storage within 2 mins
    const cachedValue = await this.cacheManager.get(`tokenList-${type}`);
    if (cachedValue) {
      this.logger.log(`Pulled ${type} tokens from cache...`);
      return cachedValue as TokenList;
    }

    // Check 2: Latest Database entry within 5 mins
    const tokenList: TokenList = await this.findTokenList(type);
    const databaseValue = await this.verifyDatabaseTime(tokenList);
    if (databaseValue) {
      this.logger.log(`Pulled ${type} tokens from database entry...`);
      return databaseValue;
    }

    // Check 3: Update Created At & Get new data, while returning existing data
    await this.updateTokenListCreatedAt();
    this.refreshTokensLists();

    return tokenList;
  }

  /* 
    MAIN FUNCTIONS TO PROCESS TOKEN DATA
  */

  async refreshTokensLists(): Promise<any> {
    const { data } = await this.httpService
      .get('https://apeswap-strapi.herokuapp.com/home-v-2-token-lists')
      .toPromise();

    this.processTokensFromSubgraphData(56, data[0].bsc);
    this.processTokensFromSubgraphData(137, data[0].polygon);
  }

  async processTokensFromSubgraphData(
    chainId: number,
    tokenListConfig: any,
  ): Promise<any> {
    // 1. Get raw token data from subgraph, both now & 24 hours ago
    const {
      currentTokenData,
      previousTokenData,
    } = await this.getRawTokenDataFromSubgraph(chainId);

    // 2. Filter raw token data into data for the database
    const filteredTokenData = await this.prepDataForDatabase(
      currentTokenData,
      previousTokenData,
    );

    // 3. Store ALL token data for the given chain in DB & cache
    await this.cacheManager.set(`tokenLists-${chainId}`, filteredTokenData, {
      ttl: 120,
    });
    const tokenStorageResponse = await this.createTokenList({
      title: `all-${chainId}`,
      tokens: filteredTokenData,
    });

    // 4. Iterate through the token lists on strapi to map to subgraph data & store findings in the database
    tokenListConfig.forEach(async (tokenList) => {
      const applicableTokens = [];
      const { type, tokens } = tokenList;

      // Go through each token on strapi & find its match on subgraph data pull
      for (let i = 0; i < tokens.length; i++) {
        applicableTokens.push(
          filteredTokenData.find(
            ({ contractAddress }) =>
              tokens[i].toLowerCase() === contractAddress.toLowerCase(),
          ),
        );

        // Store each computed token list in cache & MongoDB
        await this.cacheManager.set(`tokenList-${type}`, applicableTokens, {
          ttl: 120,
        });
        await this.createTokenList({
          title: type,
          tokens: applicableTokens,
        });
      }
    });

    this.logger.log(
      `Refresh for chain ${chainId} complete. Data stored in cache & database`,
    );
    return tokenStorageResponse;
  }

  /*
    SUBGRAPH FUNCTIONALITY
  */
  async getRawTokenDataFromSubgraph(chainId: number): Promise<any> {
    let yesterdayBlock: number;

    // TODO: Update previous block times to be more precise (particularly Polygon)
    if (chainId === 56) {
      yesterdayBlock = (await this.bscWeb3.eth.getBlockNumber()) - 28800;
    } else if (chainId === 137) {
      yesterdayBlock = (await this.polygonWeb3.eth.getBlockNumber()) - 43200;
    }

    const currentTokenData = await this.subgraphService.getTopTokensData(
      chainId,
      'now',
    );
    const previousTokenData = await this.subgraphService.getTopTokensData(
      chainId,
      yesterdayBlock.toString(),
    );

    return {
      currentTokenData: currentTokenData.tokens,
      previousTokenData: previousTokenData.tokens,
    };
  }

  /*
    FILTER & UTILS FUNCTIONALITY
  */
  async prepDataForDatabase(
    currentTokenData: any,
    previousTokenData: any,
  ): Promise<any> {
    const preppedTokens: Token[] = [];

    // Get most recent list of tokens from single source of truth, github token list (env var)
    const {
      data: { tokens },
    } = await this.httpService.get(this.TOKEN_LIST_URL).toPromise();

    // Loop through current tokens to find and calculate matching tokens from previous datadate
    for (let i = 0; i < currentTokenData.length; i++) {
      const { id, symbol, tokenDayData } = currentTokenData[i];
      const previousToken = previousTokenData.find(
        ({ id: prevId }) => prevId.toLowerCase() === id.toLowerCase(),
      );

      // Skip the iteration if no matching token found
      if (!previousToken || !tokenDayData[0]) {
        continue;
      }

      // Get price & % change
      const currentPrice = parseFloat(tokenDayData[0].priceUSD);
      const previousPrice = parseFloat(previousToken.tokenDayData[0].priceUSD);
      const percentageChange = (currentPrice - previousPrice) / previousPrice;

      // Get logo URL
      const logoUrl = await this.getTokenLogoUrl(id, tokens);

      // Push token info properly filtered to the array
      preppedTokens.push({
        tokenTicker: symbol,
        tokenPrice: currentPrice,
        percentChange: percentageChange,
        contractAddress: id,
        logoUrl,
      });
    }

    return preppedTokens;
  }

  getTokenLogoUrl = async (tokenAddress: string, tokenListings: any) => {
    return tokenListings.find(
      (token) => tokenAddress.toUpperCase() === token.address.toUpperCase(),
    )?.logoURI;
  };

  // Called if cache comes up expired and we're trying to check the database stats for /tvl or just /
  async verifyDatabaseTime(data: any, time = 30000) {
    const now = Date.now();

    if (!data?.createdAt) return null;

    // If the last DB creation was created greater than 5 mins ago, reject.
    const lastCreatedAt = new Date(data.createdAt).getTime();
    if (now - lastCreatedAt > time) return null;

    return data;
  }

  /* 
    DATABASE FUNCTIONALITY
  */
  createTokenList(tokenList: any) {
    return this.tokenListModel.updateOne(
      { title: tokenList.title },
      {
        $set: tokenList,
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

  findTokenList(type: string) {
    return this.tokenListModel.findOne({ title: type });
  }

  findAllTokenLists() {
    return this.tokenListModel.find();
  }

  updateTokenListCreatedAt() {
    return this.tokenListModel.updateMany(
      {},
      {
        $currentDate: {
          createdAt: true,
        },
      },
    );
  }
}

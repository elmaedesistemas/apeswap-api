/*
  TODO
  - Get things working on Polygon side (web3 config seems to be just for 1 chain)
  - Make cron jobs for all
  - Improve efficiency and cleanliness of code (less for loops)
  - Add basic error handling
*/

import { Injectable, Logger, HttpService } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
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
    const tokenList: TokenList = await this.findTokenList(type);

    return tokenList;
  }

  // Called at /tokens/refresh/:chainId
  async refreshTokens(chainId: string): Promise<any> {
    const { data } = await this.httpService
      .get('https://apeswap-strapi.herokuapp.com/home-v-2-token-lists')
      .toPromise();

    if (parseInt(chainId) === 56) {
      const tokenListConfig = data[0].bsc;
      await this.processTokensFromSubgraphData(56, tokenListConfig);
    } else if (parseInt(chainId) === 137) {
      const tokenListConfig = data[0].polygon;
      await this.processTokensFromSubgraphData(137, tokenListConfig);
    }

    return `Refreshed ${chainId} 🐵❤️`;
  }

  /* 
    CRONJOB PROCESSOR
  */

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

    // 3. Store ALL token data for the given chain
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

        // Store each computer token list in MongoDB
        await this.createTokenList({
          title: type,
          tokens: applicableTokens,
        });
      }
    });

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
        ({ id: prevId }) => prevId === id,
      );

      // Skip the iteration if no matching token found
      if (!previousToken) continue;

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
      (element) => tokenAddress.toUpperCase() === element.address.toUpperCase(),
    )?.logoURI;
  };

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
}

export class Token {
  tokenTicker: string;
  tokenPrice: number;
  percentChange: number;
  contractAddress: string;
  logoUrl: string;
  list?: boolean;
  liquidity?: number;
}

export class StrapiTokensObject {
  type: string;
  chain: number;
  tokens: string[];
}

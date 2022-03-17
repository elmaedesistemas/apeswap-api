export class Token {
  tokenTicker: string;
  tokenPrice: number;
  percentChange: number;
  contractAddress: string;
  logoUrl: string;
}

export class StrapiTokensObject {
  type: string;
  chain: number;
  tokens: string[];
}

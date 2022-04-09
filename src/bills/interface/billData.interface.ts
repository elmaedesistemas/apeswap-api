interface TokenData {
  name: string;
  address: string;
  symbol: string;
}
export interface BillData {
  billContract: string;
  principalToken: string;
  payoutToken: string;
  createTransactionHash?: string;
  payout: number;
  deposit?: number;
  vestingPeriodSeconds: number;
  expires: number;
  billNftId: number;
  pairName: string;
  type: string;
  payoutTokenData: TokenData;
  token0: TokenData;
  token1: TokenData;
  dollarValue?: number;
}

export interface Terms {
  controlVariable: number;
  vestingTerm: string;
  minimumPrice: number;
  maxPayout: number;
  maxDebt: number;
}

export interface BillTerms {
  principalToken: string;
  payoutToken: string;
  terms: Terms;
}

export interface Attribute {
  trait_type: string;
  value: string;
}

export interface BillMetadata {
  name: string;
  description: string;
  tokenId: number;
  image?: string;
  attributes: Attribute[];
  data: BillData;
  contractAddress: string;
}

export interface BillData {
  billContract: string;
  principalToken: string;
  payoutToken: string;
  payout: number;
  deposit?: number;
  vestingPeriodSeconds: number;
  expires: number;
  billNftId: number;
}

export interface Terms {
  controlVariable: number;
  vestingTerm: number;
  minimumPrice: number;
  maxPayout: number;
  maxDebt: number;
}

export interface BillTerms {
  principalToken: string;
  payoutToken: string;
  terms: Terms;
}

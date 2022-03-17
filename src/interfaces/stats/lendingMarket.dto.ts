export class LendingMarket {
  readonly name: string;
  readonly marketAddress: string;
  readonly apys?: {
    borrowApyPercent?: number;
    supplyApyPercent?: number;
    borrowDistributionApyPercent?: number;
    supplyDistributionApyPercent?: number;
  };
}

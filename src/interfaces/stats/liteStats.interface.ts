export interface LiteStatsI {
  readonly address: string;
  readonly lpSymbol: string;
  readonly stakedTvl: number;
  readonly pendingReward: number;
  readonly apr: number;
}

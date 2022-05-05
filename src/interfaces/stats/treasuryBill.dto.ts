export class TreasuryBill {
  readonly type: string;
  readonly billAddress: string;
  readonly lpToken: string;
  readonly lpTokenName: string;
  readonly earnToken: string;
  readonly earnTokenName?: string;
  readonly discount?: number;
  readonly link: string;
}

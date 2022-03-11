export class BalanceDto {
  address: string;
  name: string;
  symbol: string;
  value: number;
  price: number;
}
export class WalletBalanceDto {
  address?: string;
  balances?: BalanceDto[];
}

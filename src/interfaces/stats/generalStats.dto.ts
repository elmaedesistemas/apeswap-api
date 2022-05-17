import { ApiHideProperty } from '@nestjs/swagger';
import { Validate } from 'class-validator';
import { OnlyNetwork } from 'src/utils/validator/onlyNetwork';
import { FarmStatsDto } from './farm.dto';
import { IncentivizedPoolStats } from './incentivizedPool.dto';
import { LendingMarket } from './lendingMarket.dto';
import { PoolStats } from './pool.dto';
import { TreasuryBill } from './treasuryBill.dto';

export class GeneralStats {
  readonly bananaPrice: number;
  readonly burntAmount: number;
  readonly totalSupply: number;
  readonly circulatingSupply: number;
  readonly marketCap: number;
  tvl: number;
  poolsTvl: number;

  @ApiHideProperty()
  readonly tvlInBnb?: number;
  totalLiquidity: number;
  totalVolume: number;
  pools: PoolStats[];
  farms: FarmStatsDto[];
  incentivizedPools: IncentivizedPoolStats[];
  lendingData?: LendingMarket[];
  bills?: TreasuryBill[];
}

export class GeneralStatsNetworkDto {
  readonly chainId: number;
  bananaPrice: number;
  readonly burntAmount: number;
  readonly totalSupply: number;
  readonly circulatingSupply: number;
  readonly marketCap: number;
  gnanaCirculatingSupply?: number;
  poolsTvl: number;

  @ApiHideProperty()
  pools?: PoolStats[];
  farms?: FarmStatsDto[];
  incentivizedPools: IncentivizedPoolStats[];
  lendingData?: LendingMarket[];
  bills?: TreasuryBill[];
}

export class ChainIdDto {
  @Validate(OnlyNetwork)
  chainId: number;
}

class LpApr {
  pid: number;
  lpApr: number;
}

export class ApeLpApr {
  chainId: number;
  lpAprs: LpApr[];
}

class YieldFarmingFeature {
  id: number;
  apr: number;
  stakeToken: any;
  rewardToken: any;
  link: string;
}

class LendingFeature {
  marketAddress: string;
  apy: number;
  token: any;
  link: string;
}

class BillFeature {
  billAddress: string;
  discount: number;
  lpToken: any;
  earnToken: any;
  link: string;
}

export class HomepageFeatures {
  farmDetails: YieldFarmingFeature[];
  poolDetails: YieldFarmingFeature[];
  lendingDetails: LendingFeature[];
  billDetails?: BillFeature[];
}

export class PoolTokenDto {
  address: string;
  token0: string;
  q0: number;
  token1: string;
  q1: number;
  totalSupply: number;
  stakingAddress: string;
  staked: number;
  decimals: number;
  tokens: string[];
}

export class FarmLPDto {
  address: string;
  allocPoints: number;
  poolToken: PoolTokenDto;
  poolIndex: number;
  lastRewardBlock: number;
}
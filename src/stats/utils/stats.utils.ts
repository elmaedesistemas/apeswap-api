import { getContract } from 'src/utils/lib/web3';
import BigNumber from 'bignumber.js';
import {
  getParameterCaseInsensitive,
  createLpPairName,
} from 'src/utils/helpers';

import { MASTER_APE_ABI } from './abi/masterApeAbi';
import configuration from 'src/config/configuration';
import { BEP20_REWARD_APE_ABI } from './abi/bep20RewardApeAbi';
import { getBalanceNumber } from 'src/utils/math';
import { multicallNetwork } from 'src/utils/lib/multicall';
import { MINI_COMPLEX_REWARDER_ABI } from './abi/miniComplexRewarderAbi';
import { OLA_LENS_ABI } from './abi/OlaCompoundLens';

export const SECONDS_PER_YEAR = new BigNumber(31536000);
// ADDRESS GETTERS
export function masterApeContractAddress(): string {
  return configuration()[process.env.CHAIN_ID].contracts.masterApe;
}

export function bananaAddress(): string {
  return configuration()[process.env.CHAIN_ID].contracts.banana;
}

export function goldenBananaAddress(): string {
  return configuration()[process.env.CHAIN_ID].contracts.goldenBanana;
}

export function gBananaTreasury(): string {
  return configuration()[process.env.CHAIN_ID].contracts.gBananaTreasury;
}

function bnbAddress(): string {
  return configuration()[process.env.CHAIN_ID].contracts.bnb;
}

function bananaBusdAddress(): string {
  return configuration()[process.env.CHAIN_ID].contracts.bananaBusd;
}

function bananaBnbAddress(): string {
  return configuration()[process.env.CHAIN_ID].contracts.bananaBnb;
}

export function burnAddress(): string {
  return configuration()[process.env.CHAIN_ID].contracts.burn;
}

export function apePriceGetter(): string {
  return configuration()[process.env.CHAIN_ID].apePriceGetter;
}

export function masterApeContractWeb(): any {
  return getContract(MASTER_APE_ABI, masterApeContractAddress());
}

export function lendingAddress(): any {
  return configuration()[process.env.CHAIN_ID].lending;
}

export function unitrollerAddress(): any {
  return configuration()[process.env.CHAIN_ID].unitroller;
}

export function olaCompoundLensAddress(): string {
  return configuration()[process.env.CHAIN_ID].olaCompoundLens;
}

export function lendingMarkets(): [{ name: string; contract: string }] {
  return configuration()[process.env.CHAIN_ID].lendingMarkets;
}

export function olaCompoundLensContractWeb3(): any {
  return getContract(OLA_LENS_ABI, olaCompoundLensAddress());
}

export function getBananaPriceWithPoolList(poolList, prices) {
  const poolBusd = poolList.find(
    (pool) => pool.address === bananaBusdAddress(),
  );
  const bananaPriceUsingBusd = poolBusd.poolToken.q1 / poolBusd.poolToken.q0;
  if (prices[bnbAddress()]) {
    const poolBnb = poolList.find(
      (pool) => pool.address === bananaBnbAddress(),
    );
    const bnbTvl =
      (poolBnb.poolToken.q1 * prices[bnbAddress()].usd) /
      10 ** poolBnb.poolToken.decimals;
    const busdTvl = poolBusd.poolToken.q1 / 10 ** poolBusd.poolToken.decimals;
    const bananaPriceUsingBnb =
      (poolBnb.poolToken.q1 * prices[bnbAddress()].usd) / poolBnb.poolToken.q0;

    return (
      (bananaPriceUsingBnb * bnbTvl + bananaPriceUsingBusd * busdTvl) /
      (bnbTvl + busdTvl)
    );
  }

  return bananaPriceUsingBusd;
}

export function getPoolPrices(
  tokens,
  prices,
  pool,
  poolPrices,
  poolIndex,
  allocPoints,
  totalAllocPoints,
  rewardsPerDay,
  bananaAddress,
) {
  if (pool.token0 != null) {
    poolPrices.farms.push({
      ...{ poolIndex: poolIndex },
      ...getFarmLPTokenPrices(
        tokens,
        prices,
        pool,
        allocPoints,
        totalAllocPoints,
        rewardsPerDay,
        bananaAddress,
      ),
    });
  } else {
    poolPrices.pools.push({
      ...{ poolIndex: poolIndex },
      ...getBep20Prices(
        prices,
        pool,
        allocPoints,
        totalAllocPoints,
        rewardsPerDay,
        bananaAddress,
      ),
    });
  }
}

// Given array of prices and single farm contract, return price and tvl info for farm
function getFarmLPTokenPrices(
  tokens,
  prices,
  pool,
  allocPoints,
  totalAllocPoints,
  rewardsPerDay,
  bananaAddress,
) {
  const t0 = getParameterCaseInsensitive(tokens, pool.token0);
  let p0 = getParameterCaseInsensitive(prices, pool.token0)?.usd;
  const t1 = getParameterCaseInsensitive(tokens, pool.token1);
  let p1 = getParameterCaseInsensitive(prices, pool.token1)?.usd;

  if (p0 == null && p1 == null) {
    return undefined;
  }
  const q0 = pool.q0 / 10 ** t0.decimals;
  const q1 = pool.q1 / 10 ** t1.decimals;
  if (p0 == null) {
    p0 = (q1 * p1) / q0;
    prices[pool.token0] = { usd: p0 };
  }
  if (p1 == null) {
    p1 = (q0 * p0) / q1;
    prices[pool.token1] = { usd: p1 };
  }
  const tvl = q0 * p0 + q1 * p1;
  const price = tvl / pool.totalSupply;
  prices[pool.address] = { usd: price };
  const stakedTvl = pool.staked * price;

  // APR calculations
  const poolRewardsPerDay = (allocPoints / totalAllocPoints) * rewardsPerDay;
  const apr =
    ((poolRewardsPerDay * prices[bananaAddress].usd) / stakedTvl) * 365;
  return {
    address: pool.address,
    name: createLpPairName(t0.symbol, t1.symbol),
    t0Address: t0.address,
    t0Symbol: t0.symbol,
    t0Decimals: t0.decimals,
    p0,
    q0,
    t1Address: t1.address,
    t1Symbol: t1.symbol,
    t1Decimals: t1.decimals,
    p1,
    q1,
    price,
    totalSupply: pool.totalSupply,
    tvl,
    stakedTvl,
    apr,
    rewardTokenPrice: getParameterCaseInsensitive(prices, bananaAddress)?.usd,
    rewardTokenSymbol: 'BANANA',
    decimals: pool.decimals,
  };
}

// Given array of prices and single pool contract, return price and tvl info for pool
function getBep20Prices(
  prices,
  pool,
  allocPoints,
  totalAllocPoints,
  rewardsPerDay,
  bananaAddress,
) {
  const price = getParameterCaseInsensitive(prices, pool.address)?.usd || 0;
  const tvl = (pool.totalSupply * price) / 10 ** pool.decimals;
  const stakedTvl = pool.staked * price;

  // APR calculations
  const poolRewardsPerDay = (allocPoints / totalAllocPoints) * rewardsPerDay;
  const apr =
    ((poolRewardsPerDay * prices[bananaAddress].usd) / stakedTvl) * 365;

  return {
    address: pool.address,
    lpSymbol: pool.symbol,
    price,
    tvl,
    stakedTvl,
    staked: pool.staked,
    apr,
    rewardTokenPrice: getParameterCaseInsensitive(prices, bananaAddress)?.usd,
    rewardTokenSymbol: 'BANANA',
    decimals: pool.decimals,
  };
}

// Get TVL info for Pools only given a wallet
export async function getWalletStatsForPools(
  wallet,
  pools,
  masterApeContract,
): Promise<any> {
  const allPools = [];
  await Promise.all(
    pools.map(async (pool) => {
      const userInfo = await masterApeContract.methods
        .userInfo(pool.poolIndex, wallet)
        .call();
      const pendingReward =
        (await masterApeContract.methods
          .pendingCake(pool.poolIndex, wallet)
          .call()) /
        10 ** pool.decimals;

      if (userInfo.amount != 0 || pendingReward != 0) {
        const stakedTvl = (userInfo.amount * pool.price) / 10 ** pool.decimals;
        const dollarsEarnedPerDay = (stakedTvl * pool.apr) / 365;
        const tokensEarnedPerDay = dollarsEarnedPerDay / pool.rewardTokenPrice;
        const curr_pool = {
          address: pool.address,
          name: pool.lpSymbol,
          rewardTokenSymbol: pool.rewardTokenSymbol,
          stakedTvl,
          pendingReward,
          pendingRewardUsd: pendingReward * pool.rewardTokenPrice,
          apr: pool.apr,
          dollarsEarnedPerDay,
          dollarsEarnedPerWeek: dollarsEarnedPerDay * 7,
          dollarsEarnedPerMonth: dollarsEarnedPerDay * 30,
          dollarsEarnedPerYear: dollarsEarnedPerDay * 365,
          tokensEarnedPerDay,
          tokensEarnedPerWeek: tokensEarnedPerDay * 7,
          tokensEarnedPerMonth: tokensEarnedPerDay * 30,
          tokensEarnedPerYear: tokensEarnedPerDay * 365,
        };

        allPools.push(curr_pool);
      }
    }),
  );
  return allPools;
}

// Get TVL info for Farms only given a wallet
export async function getWalletStatsForFarms(
  wallet,
  farms,
  masterApeContract,
): Promise<any> {
  const allFarms = [];
  await Promise.all(
    farms.map(async (farm) => {
      const userInfo = await masterApeContract.methods
        .userInfo(farm.poolIndex, wallet)
        .call();
      const pendingReward =
        (await masterApeContract.methods
          .pendingCake(farm.poolIndex, wallet)
          .call()) /
        10 ** farm.decimals;

      if (userInfo.amount != 0 || pendingReward != 0) {
        const stakedTvl = (userInfo.amount * farm.price) / 10 ** farm.decimals;
        const dollarsEarnedPerDay = (stakedTvl * farm.apr) / 365;
        const tokensEarnedPerDay = dollarsEarnedPerDay / farm.rewardTokenPrice;
        const curr_farm = {
          address: farm.address,
          name: farm.name,
          stakedTvl,
          pendingReward,
          pendingRewardUsd: pendingReward * farm.rewardTokenPrice,
          apr: farm.apr,
          dollarsEarnedPerDay,
          dollarsEarnedPerWeek: dollarsEarnedPerDay * 7,
          dollarsEarnedPerMonth: dollarsEarnedPerDay * 30,
          dollarsEarnedPerYear: dollarsEarnedPerDay * 365,
          tokensEarnedPerDay,
          tokensEarnedPerWeek: tokensEarnedPerDay * 7,
          tokensEarnedPerMonth: tokensEarnedPerDay * 30,
          tokensEarnedPerYear: tokensEarnedPerDay * 365,
        };

        allFarms.push(curr_farm);
      }
    }),
  );
  return allFarms;
}

// Get TVL info for IncentivizedPools only given a wallet
export async function getWalletStatsForIncentivizedPools(
  wallet,
  pools,
): Promise<any> {
  const allIncentivizedPools = [];
  await Promise.all(
    pools.map(async (incentivizedPool) => {
      const contract = getContract(
        BEP20_REWARD_APE_ABI,
        incentivizedPool.address,
      );
      const userInfo = await contract.methods.userInfo(wallet).call();
      const pendingReward =
        (await contract.methods.pendingReward(wallet).call()) /
        10 ** incentivizedPool.rewardDecimals;

      if (userInfo.amount != 0 || pendingReward != 0) {
        const stakedTvl =
          (userInfo.amount * incentivizedPool.price) /
          10 ** incentivizedPool.stakedTokenDecimals;
        const dollarsEarnedPerDay = (stakedTvl * incentivizedPool.apr) / 365;
        const tokensEarnedPerDay =
          dollarsEarnedPerDay / incentivizedPool.rewardTokenPrice;
        const curr_pool = {
          id: incentivizedPool.sousId,
          address: incentivizedPool.address,
          name: incentivizedPool.name,
          rewardTokenSymbol: incentivizedPool.rewardTokenSymbol,
          stakedTvl,
          pendingReward,
          pendingRewardUsd: pendingReward * incentivizedPool.rewardTokenPrice,
          apr: incentivizedPool.apr,
          dollarsEarnedPerDay,
          dollarsEarnedPerWeek: dollarsEarnedPerDay * 7,
          dollarsEarnedPerMonth: dollarsEarnedPerDay * 30,
          dollarsEarnedPerYear: dollarsEarnedPerDay * 365,
          tokensEarnedPerDay,
          tokensEarnedPerWeek: tokensEarnedPerDay * 7,
          tokensEarnedPerMonth: tokensEarnedPerDay * 30,
          tokensEarnedPerYear: tokensEarnedPerDay * 365,
        };

        allIncentivizedPools.push(curr_pool);
      }
    }),
  );
  return allIncentivizedPools;
}

export const getDualFarmApr = (
  poolLiquidityUsd: number,
  miniChefRewardTokenPrice: number,
  miniChefTokensPerSecond: string,
  rewarerdTokenPrice: number,
  rewarderTokensPerSecond: string,
): number => {
  const totalRewarderRewardPricePerYear = new BigNumber(rewarerdTokenPrice)
    .times(rewarderTokensPerSecond)
    .times(SECONDS_PER_YEAR);
  const totalMiniChefRewardPricePerYear = new BigNumber(
    miniChefRewardTokenPrice,
  )
    .times(miniChefTokensPerSecond)
    .times(SECONDS_PER_YEAR);
  const totalRewardsPerYear = totalMiniChefRewardPricePerYear.plus(
    totalRewarderRewardPricePerYear,
  );
  const apr = totalRewardsPerYear.div(poolLiquidityUsd).times(100);
  return apr.isNaN() || !apr.isFinite() ? null : apr.toNumber();
};

export const arrayChunk = (array, chunk = 95) => {
  return array.reduce((all, one, i) => {
    const ch = Math.floor(i / chunk);
    all[ch] = [].concat(all[ch] || [], one);
    return all;
  }, []);
};

const getCallsErcBalances = (dualFarmConfig, miniChefAddress) => {
  const lpAddress = dualFarmConfig.stakeTokenAddress;
  return [
    {
      address: dualFarmConfig.stakeTokens.token0.address,
      name: 'balanceOf',
      params: [lpAddress],
    },
    {
      address: dualFarmConfig.stakeTokens.token1.address,
      name: 'balanceOf',
      params: [lpAddress],
    },
    {
      address: lpAddress,
      name: 'balanceOf',
      params: [miniChefAddress],
    },
    {
      address: lpAddress,
      name: 'totalSupply',
    },
  ];
};

export const getTokensPrices = (dualFarmConfig, tokenPrices) => {
  return {
    quoteToken:
      tokenPrices[dualFarmConfig.stakeTokens.token0.address.toLowerCase()],
    token1:
      tokenPrices[dualFarmConfig.stakeTokens.token1.address.toLowerCase()],
    miniChefRewarderToken:
      tokenPrices[dualFarmConfig.rewardTokens.token0.address.toLowerCase()],
    rewarderToken:
      tokenPrices[dualFarmConfig.rewardTokens.token1.address.toLowerCase()],
  };
};

export async function calculateMiscAmounts(
  abiErc,
  dualFarmConfig,
  miniChefAddress,
  quoteToken,
  token1,
  chainId,
) {
  const [
    quoteTokenBlanceLP,
    tokenBalanceLP,
    lpTokenBalanceMC,
    lpTotalSupply,
  ] = await multicallNetwork(
    abiErc,
    getCallsErcBalances(dualFarmConfig, miniChefAddress),
    chainId,
  );
  const lpTokenRatio = new BigNumber(lpTokenBalanceMC).div(
    new BigNumber(lpTotalSupply),
  );
  const lpTotalInQuoteToken = new BigNumber(quoteTokenBlanceLP)
    .div(new BigNumber(10).pow(quoteToken?.decimals))
    .times(new BigNumber(2))
    .times(lpTokenRatio);

  const totalInQuoteToken = new BigNumber(quoteTokenBlanceLP)
    .div(new BigNumber(10).pow(quoteToken?.decimals))
    .times(new BigNumber(2));

  const tokenAmount = new BigNumber(tokenBalanceLP)
    .div(new BigNumber(10).pow(token1?.decimals))
    .times(lpTokenRatio);
  const quoteTokenAmount = new BigNumber(quoteTokenBlanceLP)
    .div(new BigNumber(10).pow(quoteToken?.decimals))
    .times(lpTokenRatio);
  const totalStaked = quoteTokenAmount
    .times(new BigNumber(2))
    .times(quoteToken?.usd);
  const totalValueInLp = new BigNumber(quoteTokenBlanceLP)
    .div(new BigNumber(10).pow(quoteToken?.decimals))
    .times(new BigNumber(2))
    .times(quoteToken?.usd);
  const stakeTokenPrice = totalValueInLp
    .div(new BigNumber(getBalanceNumber(lpTotalSupply)))
    .toNumber();

  return {
    totalStaked,
    tokenAmount,
    quoteTokenAmount,
    stakeTokenPrice,
    totalInQuoteToken,
    lpTotalInQuoteToken,
  };
}

export async function getRewarderInfo(dualFarmConfig, rewarderToken, chainId) {
  let rewarderTotalAlloc = null;
  let rewarderInfo = null;
  let rewardsPerSecond = null;

  if (
    dualFarmConfig.rewarderAddress.toLowerCase() ===
    '0x1F234B1b83e21Cb5e2b99b4E498fe70Ef2d6e3bf'.toLowerCase()
  ) {
    // Temporary until we integrate the subgraph to the frontend
    rewarderTotalAlloc = 10000;
    const multiReturn = await multicallNetwork(
      MINI_COMPLEX_REWARDER_ABI,
      [
        {
          address: dualFarmConfig.rewarderAddress,
          name: 'poolInfo',
          params: [dualFarmConfig.pid],
        },
        {
          address: dualFarmConfig.rewarderAddress,
          name: 'rewardPerSecond',
        },
      ],
      chainId,
    );
    rewarderInfo = multiReturn[0];
    rewardsPerSecond = multiReturn[1];
  } else {
    const multiReturn = await multicallNetwork(
      MINI_COMPLEX_REWARDER_ABI,
      [
        {
          address: dualFarmConfig.rewarderAddress,
          name: 'poolInfo',
          params: [dualFarmConfig.pid],
        },
        {
          address: dualFarmConfig.rewarderAddress,
          name: 'rewardPerSecond',
        },
        {
          address: dualFarmConfig.rewarderAddress,
          name: 'totalAllocPoint',
        },
      ],
      chainId,
    );
    rewarderInfo = multiReturn[0];
    rewardsPerSecond = multiReturn[1];
    rewarderTotalAlloc = multiReturn[2];
  }

  const rewarderAllocPoint = new BigNumber(rewarderInfo?.allocPoint?._hex);
  const rewarderPoolWeight = rewarderAllocPoint.div(
    new BigNumber(rewarderTotalAlloc),
  );
  const rewarderPoolRewardPerSecond = getBalanceNumber(
    rewarderPoolWeight.times(rewardsPerSecond),
    rewarderToken?.decimals,
  );

  return {
    rewarderPoolRewardPerSecond,
  };
}

export async function getAllocInfo(
  abiMasterApe,
  miniChefAddress,
  dualFarmConfig,
  miniChefRewarderToken,
  chainId,
) {
  let alloc = null;
  let multiplier = 'unset';
  let miniChefPoolRewardPerSecond = null;
  try {
    const [
      info,
      totalAllocPoint,
      miniChefRewardsPerSecond,
    ] = await multicallNetwork(
      abiMasterApe,
      [
        {
          address: miniChefAddress,
          name: 'poolInfo',
          params: [dualFarmConfig.pid],
        },
        {
          address: miniChefAddress,
          name: 'totalAllocPoint',
        },
        {
          address: miniChefAddress,
          name: 'bananaPerSecond',
        },
      ],
      chainId,
    );
    const allocPoint = new BigNumber(info.allocPoint._hex);
    const poolWeight = allocPoint.div(new BigNumber(totalAllocPoint));
    miniChefPoolRewardPerSecond = getBalanceNumber(
      poolWeight.times(miniChefRewardsPerSecond),
      miniChefRewarderToken?.decimals,
    );
    alloc = poolWeight.toJSON();
    multiplier = `${allocPoint.div(100).toString()}X`;
    // eslint-disable-next-line no-empty
  } catch (error) {
    console.warn('Error fetching farm', error, dualFarmConfig);
  }

  return {
    alloc,
    multiplier,
    miniChefPoolRewardPerSecond,
  };
}

export const getLiquidityFarm = (balance, farm) => {
  const balances = balance.find(
    (b) => b.address.toLowerCase() === farm.address.toLowerCase(),
  );
  let liquidity;
  let tokenBalance = balances.balances.find(
    (b) => b.currency?.address.toLowerCase() === farm.t0Address.toLowerCase(),
  );
  if (tokenBalance) return calculateValue(tokenBalance.value, farm?.p0);
  if (!liquidity) {
    tokenBalance = balances.balances.find(
      (b) => b.currency.address.toLowerCase() === farm.t1Address.toLowerCase(),
    );
    if (tokenBalance) return calculateValue(tokenBalance.value, farm?.p1);
  }
  if (!liquidity) liquidity = 0;

  return liquidity;
};

const calculateValue = (balance, farm) => {
  const value = balance < 0 ? balance*-1 : balance;
  return value * 2 * farm;
}

import { ERC20_ABI } from 'src/stats/utils/abi/erc20Abi';
import { LP_ABI } from 'src/stats/utils/abi/lpAbi';
import { multicall } from 'src/utils/lib/multicall';

export async function getLpInfo(tokenAddress) {
  try {
    const [
      reserves,
      decimals,
      token0,
      token1,
      supply,
      balanceOf,
    ] = await multicall(LP_ABI, [
      {
        address: tokenAddress,
        name: 'getReserves',
      },
      {
        address: tokenAddress,
        name: 'decimals',
      },
      {
        address: tokenAddress,
        name: 'token0',
      },
      {
        address: tokenAddress,
        name: 'token1',
      },
      {
        address: tokenAddress,
        name: 'totalSupply',
      },
    ]);

    const [
      token0Name,
      token0Symbol,
      token1Name,
      token1Symbol,
    ] = await multicall(ERC20_ABI, [
      {
        address: token0[0],
        name: 'name',
      },
      {
        address: token0[0],
        name: 'symbol',
      },
      {
        address: token1[0],
        name: 'name',
      },
      {
        address: token1[0],
        name: 'symbol',
      },
    ]);

    const totalSupply = supply / 10 ** decimals[0];
    const staked = balanceOf / 10 ** decimals[0];

    const q0 = reserves._reserve0;
    const q1 = reserves._reserve1;
    return {
      address: tokenAddress,
      token0: { address: token0[0], symbol: token0Symbol, name: token0Name },
      q0,
      token1: { address: token1[0], symbol: token1Symbol, name: token1Name },
      q1,
      totalSupply,
      staked,
      decimals: decimals[0],
      tokens: [token0[0], token1[0]],
    };
  } catch (error) {
    console.log('inusual ', tokenAddress);
    console.log(error);
  }
}

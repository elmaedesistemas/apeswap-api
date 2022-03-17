export const liquidityQuery = `{
      uniswapFactory(id: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6") {
        id
        totalVolumeUSD
        totalLiquidityUSD
        totalLiquidityETH
      }
    }`;

export const polygonLiquidityQuery = `{
      uniswapFactory(id: "0xcf083be4164828f00cae704ec15a36d711491284") {
        id
        totalVolumeUSD
        totalLiquidityUSD
        totalLiquidityETH
      }
    }`;

export const pairsQuery = `{
  pairs {
    id
    token0 {
      id
      symbol
      derivedBNB: derivedETH
			tradeVolumeUSD
    }
    token1 {
      id
      symbol
      derivedBNB: derivedETH
			tradeVolumeUSD
    }
    token0Price
    token1Price
    reserve0
    reserve1
    volumeUSD
    totalSupply
    derivedBNB: reserveETH
  }
}`;

export function topTokensQuery(block: string) {
  let input = '';
  if (block !== 'now') {
    input = ` block: {number: ${block}}`;
  }

  return `{
    tokens(orderBy: tradeVolumeUSD orderDirection: desc first: 300${input}) {
      id
      symbol
      name
      tokenDayData(orderBy: date orderDirection: desc, first: 1) {
        id
        priceUSD
      }
    }
  }`;
}

export function dayData(skip: number, startTime: number, endTime: number) {
  return `{
    apeswapDayDatas: uniswapDayDatas(first: 1000, skip: ${skip}, where: { date_gt: ${startTime}, date_lt: ${endTime} }, orderBy: date, orderDirection: desc) {
      id
      date
      totalVolumeUSD
      dailyVolumeUSD
      dailyVolumeBNB: dailyVolumeETH
      totalLiquidityUSD
      totalLiquidityBNB: totalLiquidityETH
    }
  }`;
}

export function swapsData(
  pair: string,
  startTime: number,
  endTime: number,
  first = 1000,
  skip = 0,
) {
  return `{
    swaps(where: { pair:"${pair}" timestamp_gt: ${startTime} timestamp_lte: ${endTime}} first: ${first} skip: ${skip} orderBy: timestamp) {
      id
      pair {
        id
        token0 {
          id
        }
        token1 {
          id
        }
      }
      transaction {
        id
      }
      from
      timestamp
      sender
      amountUSD
    }
  }`;
}
export function usersPairDayData(
  pair: string,
  startTime: number,
  endTime: number,
  first = 1000,
  skip = 0,
) {
  return `{
    userPairDayDatas
      (orderBy: date, orderDirection: desc, 
      where: {pair: "${pair}" date_gt: ${startTime} date_lte: ${endTime} } first: ${first} skip: ${skip}) {
        id
        user {
          id
        }
        pair {
          id
        }
        dailyVolumeUSD
        date
    }
  }`;
}
export function userPairDayData(
  pair: string,
  startTime: number,
  endTime: number,
  address: string,
) {
  return `{
    userPairDayDatas
      (orderBy: date, orderDirection: desc, 
      where: {pair: "${pair}" date_gt: ${startTime} date_lte: ${endTime} user: "${address}"} ) {
        id
        user {
          id
        }
        pair {
          id
        }
        dailyVolumeUSD
        date
    }
  }`;
}

export const allPricesQuery = `{
  tokens(orderBy: tradeVolumeUSD orderDirection: desc first: 1000) {
    id
    symbol
    name
    derivedBNB: derivedETH
    tokenDayData(orderBy: date orderDirection: desc, first: 1) {
      id
      dailyTxns
      priceUSD
    }
  }
}`;

export const ETH_PRICE = (block?: number) => {
  const queryString = block
    ? `
    query bundles {
      bundles(where: { id:1 } block: {number: ${block}}) {
        id
        ethPrice
      }
    }
  `
    : ` query bundles {
      bundles(where: { id:1 }) {
        id
        ethPrice
      }
    }
  `;
  return queryString;
};

export const GET_BLOCK = (timestampFrom, timestampTo) => `
  {
    blocks(
      first: 1
      orderBy: timestamp
      orderDirection: asc
      where: { timestamp_gt: ${timestampFrom}, timestamp_lt: ${timestampTo} }
    ) {
      id
      number
      timestamp
    }
  }
`;
export const GET_BLOCKS = (timestamps) => {
  let queryString = 'query blocks {';
  queryString += timestamps.map((timestamp) => {
    return `t${timestamp}:blocks(first: 1, orderBy: timestamp, orderDirection: desc, where: { timestamp_gt: ${timestamp}, timestamp_lt: ${
      timestamp + 600
    } }) {
      number
    }`;
  });
  queryString += '}';
  return queryString;
};

export const PAIRS_BULK = (pairs) => {
  let queryString = `{
    pairs(
      where: {id_in: [`;
  queryString += pairs.map((p) => `"${p.toLowerCase()}",`);
  queryString = queryString.slice(0, -1);
  queryString += `]}
  orderBy: trackedReserveETH
  orderDirection: desc
) {
  id
  txCount
  token0 {
    id
    symbol
    name
    totalLiquidity
    derivedETH
  }
  token1 {
    id
    symbol
    name
    totalLiquidity
    derivedETH
  }
  reserve0
  reserve1
  reserveUSD
  totalSupply
  trackedReserveETH
  reserveETH
  volumeUSD
  untrackedVolumeUSD
  token0Price
  token1Price
  createdAtTimestamp
}
}`;
  return queryString;
};

export const PAIRS_HISTORICAL_BULK = (block, pairs) => {
  let pairsString = `[`;
  pairs.map((pair) => {
    return (pairsString += `"${pair}"`);
  });
  pairsString += ']';
  const queryString = `
  query pairs {
    pairs(first: 200, where: {id_in: ${pairsString}}, block: {number: ${block}}, orderBy: trackedReserveETH, orderDirection: desc) {
      id
      reserveUSD
      trackedReserveETH
      volumeUSD
      untrackedVolumeUSD
    }
  }
  `;
  return queryString;
};

export const PAIR_DATA = (pairAddress, block) => {
  return `
    {
      pairs(${
        block ? `block: {number: ${block}}` : ``
      } where: { id: "${pairAddress}"} ) {
        id
    txCount
    token0 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    token1 {
      id
      symbol
      name
      totalLiquidity
      derivedETH
    }
    reserve0
    reserve1
    reserveUSD
    totalSupply
    trackedReserveETH
    reserveETH
    volumeUSD
    untrackedVolumeUSD
    token0Price
    token1Price
    createdAtTimestamp
      }
    }`;
};

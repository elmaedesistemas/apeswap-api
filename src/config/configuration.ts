import { ERC20_ABI } from 'src/stats/utils/abi/erc20Abi';
import { ERC20_ABI_POLYGON } from 'src/stats/utils/abi/erc20AbiPolygon';
import { LP_ABI } from 'src/stats/utils/abi/lpAbi';
import { LP_ABI_POLYGON } from 'src/stats/utils/abi/lpAbiPolygon';
import { MASTER_APE_ABI } from 'src/stats/utils/abi/masterApeAbi';
import { MASTER_APE_ABI_POLYGON } from 'src/stats/utils/abi/masterApeAbiPolygon';
import { MULTICALL_ABI } from 'src/utils/lib/abi/multicallAbi';
import { MULTICALL_ABI_POLYGON } from 'src/utils/lib/abi/multicallAbiPolygon';

export default () => ({
  mongo_uri: process.env.MONGO_URL,
  environment: process.env.NODE_ENV,
  chainId: process.env.CHAIN_ID || 97,
  networksId: {
    BSC: 56,
    POLYGON: 137,
  },
  tokenListUrl: process.env.TOKEN_LIST_URL,
  dualFarmsListUrl: process.env.DUAL_FARMS_LIST_URL,
  97: {
    lottery: {
      address: '0xe42Ff4758C37ccC3A54004b176384477bbBe70D6',
      adminAddress: '0xb5e1Ec9861D7c1C99cB3d79dd602cC6122F0d7dc',
      adminKey: process.env.LOTTERY_ADMIN_KEY,
    },
    contracts: {
      masterApe: '0xAf1B22cBDbB502B2089885bcd230255f8B80243b',
      banana: '0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95',
      goldenBanana: '0x9407026d236deae22cc1f3c419a9e47cbfcfe9e5',
      bnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      bananaBusd: '0x7Bd46f6Da97312AC2DBD1749f82E202764C0B914',
      bananaBnb: '0xF65C1C0478eFDe3c19b49EcBE7ACc57BB6B1D713',
      burn: '0x000000000000000000000000000000000000dead',
      mulltiCall: '0x67ADCB4dF3931b0C5Da724058ADC2174a9844412',
      auction: '0x80a01f81b92d21e39ff1276c4a81d25cb4dc4cdb',
      gBananaTreasury: '0xec4b9d1fd8a3534e31fce1636c7479bcd29213ae',
    },
    appNodes: [
      'https://data-seed-prebsc-2-s2.binance.org:8545',
      'https://data-seed-prebsc-2-s2.binance.org:8545',
      'https://data-seed-prebsc-2-s2.binance.org:8545',
    ],
    iazoExposer: '0xe977E40f29f699F75db2A137Af0B3Db2152404b6',
    apePriceGetter: '',
  },
  56: {
    lottery: {
      address: '0x451bCf562A4d747da3455bBAFACe988d56dA6D83',
      adminAddress: '0xCaE366497aC10De7f1faeBBf496E7dBD7764C6b3',
      adminKey: process.env.LOTTERY_ADMIN_KEY,
    },
    contracts: {
      masterApe: '0x5c8D727b265DBAfaba67E050f2f739cAeEB4A6F9',
      banana: '0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95',
      goldenBanana: '0xddb3bd8645775f59496c821e4f55a7ea6a6dc299',
      bnb: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      bananaBusd: '0x7Bd46f6Da97312AC2DBD1749f82E202764C0B914',
      bananaBnb: '0xF65C1C0478eFDe3c19b49EcBE7ACc57BB6B1D713',
      burn: '0x000000000000000000000000000000000000dead',
      mulltiCall: '0x38ce767d81de3940CFa5020B55af1A400ED4F657',
      gBananaTreasury: '0xec4b9d1fd8a3534e31fce1636c7479bcd29213ae',
      auction: '0xaeCB396Be7F19618Db4C44d8e2E8C908228515E9',
    },
    apePriceGetter: '0x5e545322b83626c745FE46144a15C00C94cBD803',
    olaCompoundLens: '0x183019dc7a8f8f1456df735862761cccf2e23009',
    appNodes: [
      //'https://rpc.ankr.com/erigonbsc',
      process.env.ARCHIVE_BSC,
      // 'https://bscrpc.com/',
    ],
    archiveNode: process.env.ARCHIVE_BSC,
    lendingMarkets: [
      {
        name: 'BTC',
        contract: '0x5fce5D208DC325ff602c77497dC18F8EAdac8ADA',
      },
      {
        name: 'ETH',
        contract: '0xaA1b1E1f251610aE10E4D553b05C662e60992EEd',
      },
      {
        name: 'BANANA',
        contract: '0xC2E840BdD02B4a1d970C87A912D8576a7e61D314',
      },
      {
        name: 'BUSD',
        contract: '0x0096B6B49D13b347033438c4a699df3Afd9d2f96',
      },
      {
        name: 'USDT',
        contract: '0xdBFd516D42743CA3f1C555311F7846095D85F6Fd',
      },
      {
        name: 'USDC',
        contract: '0x91B66a9Ef4f4CAD7F8AF942855C37Dd53520f151',
      },
      {
        name: 'CAKE',
        contract: '0x3353f5bcfD7E4b146F2eD8F1e8D875733Cd754a7',
      },
      {
        name: 'BNB',
        contract: '0x34878F6a484005AA90E7188a546Ea9E52b538F6f',
      },
      {
        name: 'DOT',
        contract: '0x92D106c39aC068EB113B3Ecb3273B23Cd19e6e26',
      },
    ],
    bills: [
      {
        type: 'BANANA',
        lpTokenName: 'BANANA-BNB',
        earnTokenName: 'BANANA',
        lpToken: '0xf65c1c0478efde3c19b49ecbe7acc57bb6b1d713',
        earnToken: '0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95',
        contract: '0x8b57Fc5BE65118188D50d42fcD5614e447F7FAbE',
      },
      {
        type: 'BANANA',
        lpTokenName: 'BUSD-BNB',
        earnTokenName: 'BANANA',
        lpToken: '0x51e6d27fa57373d8d4c256231241053a70cb1d93',
        earnToken: '0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95',
        contract: '0x4925AcdE0E885170801A74DEBcC8fbA91F3aE29b',
      },
      {
        type: 'BANANA',
        lpTokenName: 'USDC-BUSD',
        earnTokenName: 'BANANA',
        lpToken: '0xc087c78abac4a0e900a327444193dbf9ba69058e',
        earnToken: '0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95',
        contract: '0xca1612f66292398a5df0ecadd98bb81dc264349d',
      },
      {
        type: 'BANANA',
        lpTokenName: 'ETH-BNB',
        earnTokenName: 'BANANA',
        lpToken: '0xa0c3ef24414ed9c9b456740128d8e63d016a9e11',
        earnToken: '0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95',
        contract: '0xb2d516086BFc978950e40D2739c72125415441a8',
      },
    ],
    iazoExposer: '0xFdfb230bFa399EC32EA8e98c2E7E3CcD953C860A',
    lending: '0xCc7aaC69015a7645dfC39ddEB5902ca9FC0Bc15C',
    unitroller: '0xAD48B2C9DC6709a560018c678e918253a65df86e',
    abi: {
      masterApe: MASTER_APE_ABI,
      multiCall: MULTICALL_ABI,
      lp: LP_ABI,
      erc20: ERC20_ABI,
    },
    feeLP: 0.15,
    baseCurrency: [
      '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      '0x2170ed0880ac9a755fd29b2688956bd959f933f8',
      '0xe9e7cea3dedca5984780bafc599bd69add087d56',
      '0x603c7f932ed1fc6575303d8fb018fdcbb0f39a95',
    ],
    subgraph: {
      blocks:
        'https://api.thegraph.com/subgraphs/name/matthewlilley/bsc-blocks',
      principal: process.env.GRAPH_URL,
    },
  },
  137: {
    contracts: {
      masterApe: '0x54aff400858Dcac39797a81894D9920f16972D1D',
      mulltiCall: '0x95028E5B8a734bb7E2071F96De89BABe75be9C8E',
      banana: '0x5d47baba0d66083c52009271faf3f50dcc01023c',
      burn: '0x000000000000000000000000000000000000dead',
    },
    apePriceGetter: '0x05D6C73D7de6E02B3f57677f849843c03320681c',
    appNodes: [
      'https://polygon-rpc.com',
      //'https://rpc-mainnet.matic.network',
      // 'https://matic-mainnet.chainstacklabs.com',
      // 'https://rpc-mainnet.maticvigil.com',
      // 'https://rpc-mainnet.matic.quiknode.pro',
      // 'https://matic-mainnet-full-rpc.bwarelabs.com',
    ],
    abi: {
      masterApe: MASTER_APE_ABI_POLYGON,
      multiCall: MULTICALL_ABI_POLYGON,
      lp: LP_ABI_POLYGON,
      erc20: ERC20_ABI_POLYGON,
    },
    feeLP: 0.05,
    baseCurrency: [
      '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174',
    ],
    subgraph: {
      blocks:
        'https://api.thegraph.com/subgraphs/name/matthewlilley/polygon-blocks',
      principal: process.env.POLYGON_GRAPH_URL,
    },
  },
});

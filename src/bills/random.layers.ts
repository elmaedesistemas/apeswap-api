import { Attribute, BillData } from './interface/billData.interface';
import Prando from 'prando';

export const Legend = [
  {
    item: 'Satoshi',
    weight: 1,
  },
  {
    item: 'Vitalik',
    weight: 2,
  },
  {
    item: 'CZ',
    weight: 3,
  },
  {
    item: 'Elizabeth Stark',
    weight: 4,
  },
  {
    item: 'John Mcafee',
    weight: 5,
  },
  {
    item: 'Sam Bankman-Fried',
    weight: 6,
  },
  {
    item: 'Hal Finney',
    weight: 7,
  },
  {
    item: 'Michael Saylor',
    weight: 8,
  },
  {
    item: 'Cobie',
    weight: 9,
  },
  {
    item: 'Zhu Su',
    weight: 10,
  },
];

export const Location = [
  {
    item: 'The Silk Road',
    weight: 1,
  },
  {
    item: 'Miami',
    weight: 2,
  },
  {
    item: 'CZug, Switzerland (Crypto Valley)',
    weight: 3,
  },
  {
    item: 'Satoshi Statue',
    weight: 4,
  },
  {
    item: 'El Salvador (Volcano)',
    weight: 5,
  },
  {
    item: 'Bitcoin Beach',
    weight: 6,
  },
  {
    item: 'Sandbox',
    weight: 7,
  },
  {
    item: 'Decentralandr',
    weight: 8,
  },
  {
    item: 'Crypto Twitter',
    weight: 9,
  },
  {
    item: 'Discord',
    weight: 10,
  },
];

export const Moment = [
  {
    item: 'The Genesis Block',
    weight: 1,
  },
  {
    item: 'Bitcoin Pizza',
    weight: 2,
  },
  {
    item: 'Bitcoin Hard Fork',
    weight: 3,
  },
  {
    item: 'Beeples $69 million NFT Sale',
    weight: 4,
  },
  {
    item: 'Bitcoin Legal Tender',
    weight: 5,
  },
  {
    item: 'The DAO Hack',
    weight: 6,
  },
  {
    item: 'Tesla Accepts Bitcoin',
    weight: 7,
  },
  {
    item: 'Mt. Gox Hack',
    weight: 8,
  },
  {
    item: '$1 Trillion Crypto Market Cap',
    weight: 9,
  },
  {
    item: 'DeFi Summer',
    weight: 10,
  },
];

export const Trend = [
  {
    item: 'HODL',
    weight: 1,
  },
  {
    item: 'Metaverse',
    weight: 2,
  },
  {
    item: 'Multi-Chain',
    weight: 3,
  },
  {
    item: 'DeFi',
    weight: 4,
  },
  {
    item: 'NFTs',
    weight: 5,
  },
  {
    item: 'ICOs',
    weight: 6,
  },
  {
    item: 'GameFi',
    weight: 7,
  },
  {
    item: 'Meme Coins',
    weight: 8,
  },
  {
    item: 'DAOs',
    weight: 9,
  },
  {
    item: 'Lending',
    weight: 10,
  },
];

export const Innovation = [
  {
    item: 'Minning Rig',
    weight: 1,
  },
  {
    item: 'Unisocks',
    weight: 2,
  },
  {
    item: 'Layer 2',
    weight: 3,
  },
  {
    item: 'Hardware Wallets',
    weight: 4,
  },
  {
    item: 'Smart Contracts',
    weight: 5,
  },
  {
    item: 'Crypto ATMs',
    weight: 6,
  },
  {
    item: 'Stablcoins',
    weight: 7,
  },
  {
    item: 'Proof of Work',
    weight: 8,
  },
  {
    item: 'Delegated Proof of Stake',
    weight: 9,
  },
];

const layers = {
  Legend,
  Location,
  Moment,
  Trend,
  Innovation,
};

export function generateV1Attributes(billData: BillData) {
  let billBorder = 'Bronze';
  if (billData.dollarValue >= 100 && billData.dollarValue < 1000) {
    billBorder = 'Silver';
  } else if (billData.dollarValue >= 1000 && billData.dollarValue < 10000) {
    billBorder = 'Gold';
  } else if (billData.dollarValue >= 10000) {
    billBorder = 'Diamond';
  }

  const attributes: Attribute[] = [
    {
      trait_type: 'Principal Token',
      value: billData.principalToken,
    },
    {
      trait_type: 'Payout Token',
      value: billData.payoutToken,
    },
    {
      trait_type: 'Vesting Period',
      value: billData.vestingPeriodSeconds.toString(),
    },
    {
      trait_type: 'Type',
      value: billData.type,
    },
    {
      trait_type: 'Version',
      value: 'V1',
    },
    {
      trait_type: 'The Legend',
      value: `Obie Dobo - ${billBorder}`,
    },
    {
      trait_type: 'The Location',
      value: 'The Jungle',
    },
    {
      trait_type: 'The Moment',
      value: 'Youthful Flute',
    },
    {
      trait_type: 'The Trend',
      value: 'BANANA',
    },
    {
      trait_type: 'The Innovation',
      value: 'Memes',
    },
  ];
  return attributes;
}

export function generateAttributes(billData: BillData) {
  const attributes: Attribute[] = [
    {
      trait_type: 'Principal Token',
      value: billData.principalToken,
    },
    {
      trait_type: 'Payout Token',
      value: billData.payoutToken,
    },
    {
      trait_type: 'Vesting Period',
      value: billData.vestingPeriodSeconds.toString(),
    },
    {
      trait_type: 'Type',
      value: billData.type,
    },
    {
      trait_type: 'Version',
      value: 'V1',
    },
    // TODO: TBD
    {
      trait_type: 'Deposit Amount',
      value: billData.deposit.toString(),
    },
    {
      trait_type: 'Payout Amount',
      value: billData.payout.toString(),
    },
  ];
  for (const key in layers) {
    attributes.push({
      trait_type: key,
      value: weightedRandom(layers[key], JSON.stringify(billData)),
    });
  }
  return attributes;
}

export function weightedRandom(options, seed) {
  let i: number;
  const rng = new Prando(seed);

  const weights = [];

  for (i = 0; i < options.length; i++)
    weights[i] = options[i].weight + (weights[i - 1] || 0);

  const random = rng.next() * weights[weights.length - 1];

  for (i = 0; i < weights.length; i++) if (weights[i] > random) break;

  return options[i].item;
}

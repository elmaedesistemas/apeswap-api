import { Attribute, BillData } from './interface/billData.dto';
import Prando from 'prando';

export const Legend = [
  {
    item: 'Satoshi',
    weight: 1,
  },
  {
    item: 'Michael Saylor',
    weight: 2,
  },
  {
    item: 'Hal Finney',
    weight: 3,
  },
  {
    item: 'Vitalik',
    weight: 4,
  },
  {
    item: 'CZ',
    weight: 5,
  },
  {
    item: 'Cobie',
    weight: 6,
  },
  {
    item: 'Sam Bankman-Fried',
    weight: 7,
  },
  {
    item: 'John Mcafee',
    weight: 8,
  },
  {
    item: 'Elizabeth Stark',
    weight: 9,
  },
  {
    item: 'Zhu Su',
    weight: 10,
  },
];

export const Location = [
  {
    item: 'Silk Road',
    weight: 1,
  },
  {
    item: 'Satoshi Statue',
    weight: 2,
  },
  {
    item: 'Bitcoin Beach',
    weight: 3,
  },
  {
    item: 'El Salvador (Volcano)',
    weight: 4,
  },
  {
    item: 'Zug, Switzerland (Crypto Valley)',
    weight: 5,
  },
  {
    item: 'Sandbox',
    weight: 6,
  },
  {
    item: 'Decentraland',
    weight: 7,
  },
  {
    item: 'Crypto Twitter',
    weight: 8,
  },
  {
    item: 'Crypto.com Arena',
    weight: 9,
  },
  {
    item: 'Miami',
    weight: 10,
  },
];

export const Moment = [
  {
    item: 'Bitcoin Pizza',
    weight: 1,
  },
  {
    item: 'Bitcoin Hard Fork',
    weight: 2,
  },
  {
    item: 'The Genesis Block',
    weight: 3,
  },
  {
    item: 'DeFi Summer',
    weight: 4,
  },
  {
    item: 'Bitcoin Legal Tender',
    weight: 5,
  },
  {
    item: 'Beeples $69 million NFT Sale',
    weight: 6,
  },
  {
    item: 'The DAO Hack',
    weight: 7,
  },
  {
    item: 'Tesla Accepts Bitcoin',
    weight: 8,
  },
  {
    item: 'Mt. Gox Hack',
    weight: 9,
  },
  {
    item: '$1 Trillion Crypto Market Cap',
    weight: 10,
  },
];

export const Trend = [
  {
    item: 'HODL',
    weight: 1,
  },
  {
    item: 'Meme Coins',
    weight: 2,
  },
  {
    item: 'NFTs',
    weight: 3,
  },
  {
    item: 'GameFi',
    weight: 4,
  },
  {
    item: 'DeFi',
    weight: 5,
  },
  {
    item: 'Metaverse',
    weight: 6,
  },
  {
    item: 'Multi-Chain',
    weight: 7,
  },
  {
    item: 'ICOs',
    weight: 8,
  },
  {
    item: 'DAOs',
    weight: 9,
  },
  {
    item: 'Web 3.0',
    weight: 10,
  },
];

export const Innovation = [
  {
    item: 'Bitcoin',
    weight: 1,
  },
  {
    item: 'Proof of Work',
    weight: 2,
  },
  {
    item: 'Smart Contracts',
    weight: 3,
  },
  {
    item: 'Unisocks',
    weight: 4,
  },
  {
    item: 'Hardware Wallets',
    weight: 5,
  },
  {
    item: 'Mining Rig',
    weight: 6,
  },
  {
    item: 'Crypto ATMs',
    weight: 7,
  },
  {
    item: 'Layer 2',
    weight: 8,
  },
  {
    item: 'Delegated Proof of Stake',
    weight: 9,
  },
  {
    item: 'Stablecoins',
    weight: 10,
  },
];

const layers = {
  ['The Legend']: Legend,
  ['The Location']: Location,
  ['The Moment']: Moment,
  ['The Trend']: Trend,
  ['The Innovation']: Innovation,
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

export function generateBnWAttributes(billData: BillData) {
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
      value: 'V2',
    },
    {
      trait_type: 'The Legend',
      value: `Obie Dobo - Black & White`,
    },
    {
      trait_type: 'The Location',
      value: 'The Jungle - Black & White',
    },
    {
      trait_type: 'The Moment',
      value: 'Youthful Flute - Black & White',
    },
    {
      trait_type: 'The Trend',
      value: 'BANANA - Black & White',
    },
    {
      trait_type: 'The Innovation',
      value: 'Memes - Black & White',
    },
  ];
  return attributes;
}

export function generateAttributes(billData: BillData) {
  if (billData.dollarValue < 50) return generateBnWAttributes(billData);
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
      value: 'V2',
    },
  ];
  // Delete dollarValue as it can change over time, messing with the deterministic intent of this generation
  const copy = { ...billData };
  delete copy.dollarValue;
  for (const key in layers) {
    attributes.push({
      trait_type: key,
      value: weightedRandom(layers[key], JSON.stringify(copy) + key),
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

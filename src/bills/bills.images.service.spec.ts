import { HttpModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BillsImagesService } from './bills.images.service';
import { BillMetadata } from './interface/billData.interface';

const MockMetadata: BillMetadata = {
  attributes: [
    {
      trait_type: 'Principal Token',
      value: '0xF65C1C0478eFDe3c19b49EcBE7ACc57BB6B1D713',
    },
    {
      trait_type: 'Payout Token',
      value: '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95',
    },
    {
      trait_type: 'Vesting Period',
      value: '1209600',
    },
    {
      trait_type: 'Type',
      value: 'Banana Bill',
    },
    {
      trait_type: 'Version',
      value: 'V1',
    },
    {
      trait_type: 'The Legend',
      value: 'Obie Dobo - Silver',
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
  ],
  name: 'Treasury Bill #18',
  description: 'Treasury Bill #18',
  data: {
    billContract: '0xdbc91eccc7245983969616996b45d841dda35d1b',
    payout: 333.41314092146433,
    deposit: 3.9996,
    createTransactionHash:
      '0x5842dad16b8c6d17bf453aa563b342f9345d7e37209883ba5908ff4c13e195e9',
    billNftId: 18,
    expires: 1650096354,
    vestingPeriodSeconds: 1209600,
    payoutToken: '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95',
    principalToken: '0xF65C1C0478eFDe3c19b49EcBE7ACc57BB6B1D713',
    type: 'Banana',
    pairName: '[BANANA]-[WBNB] LP',
    payoutTokenData: {
      address: '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95',
      name: 'ApeSwapFinance Banana',
      symbol: 'BANANA',
    },
    token0: {
      address: '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95',
      symbol: 'BANANA',
      name: 'ApeSwapFinance Banana',
    },
    token1: {
      address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      symbol: 'WBNB',
      name: 'Wrapped BNB',
    },
    dollarValue: 134.1629173227373,
  },
  tokenId: 18,
  contractAddress: '0xb0278e43dbd744327fe0d5d0aba4a77cbfc7fad8',
};

describe('Bills.ImagesService', () => {
  let service: BillsImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [BillsImagesService],
    }).compile();

    service = module.get<BillsImagesService>(BillsImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should generate bill V1 image layers', async () => {
    const result = new Date();
    result.setDate(result.getDate() + 14);
    const layers = [
      './v1/location.png',
      './v1/innovation.png',
      './v1/legend-bronze.png',
      './v1/moment.png',
      './v1/rectangles.png',
      './v1/stamp.png',
      './v1/trend.png',
      './v1/BANANA.png',
      './v1/WBNB.png',
    ];
    const image = await service.createLayers(layers);
  });

  it('Should generate bill V1 image with metadata', async () => {
    const image = await service.createBillImageWithMetadata(MockMetadata);
  });

  it('Should generate  and upload bill V1 image with metadata', async () => {
    const imageUrl = await service.createAndUploadBillImage(MockMetadata);
    console.log(imageUrl);
  });
});

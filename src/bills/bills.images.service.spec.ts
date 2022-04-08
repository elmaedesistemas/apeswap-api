import { HttpModule } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BillsImagesService } from './bills.images.service';

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

  it('should fetch tokenList', async () => {
    const tokenList = await service.fetchTokenList();
    console.log(tokenList);
  });

  it('Should generate bill image', async () => {
    const result = new Date();
    result.setDate(result.getDate() + 14);
    const config = {
      tokenAddress1: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c',
      tokenAddress2: '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95',
      payoutTokenAddress: '0x603c7f932ED1fc6575303D8Fb018fDCBb0f39a95',
      amount: 1000,
      vesting: 14,
      maturationDate: result,
      type: 'BANANA',
      background: 'https://i.imgur.com/daRKjBB.png',
    };
    const image = service.createBillImage(config);
  });
});

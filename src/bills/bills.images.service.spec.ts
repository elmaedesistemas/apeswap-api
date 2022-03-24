import { Test, TestingModule } from '@nestjs/testing';
import { BillsImagesService } from './bills.images.service';

describe('Bills.ImagesService', () => {
  let service: BillsImagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BillsImagesService],
    }).compile();

    service = module.get<BillsImagesService>(BillsImagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('Should generate bill image', async () => {
    const config = {
      token1Url:
        'https://raw.githubusercontent.com/ApeSwapFinance/apeswap-token-lists/main/assets/wbnb.png',
      token2Url:
        'https://raw.githubusercontent.com/ApeSwapFinance/apeswap-token-lists/main/assets/BANANA.png',
      background: 'https://i.imgur.com/daRKjBB.png',
    };
    const image = service.createBillImage(config);
  });
});

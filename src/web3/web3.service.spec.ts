import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import configuration from 'src/config/configuration';
import { Network } from './network.enum';

import { Web3Service } from './web3.service';
describe('Web3Service', () => {
  let service: Web3Service;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          envFilePath: ['.development.env', '.env'],
          load: [configuration],
        }),
      ],
      providers: [Web3Service, ConfigService],
    }).compile();

    service = module.get<Web3Service>(Web3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get transaction', async () => {
    const transaction = await service.getTransaction(
      Network.bsc,
      '0x7eab25d575507486589a1ca88ba18827e2b9b80cd495c6eec8963beba1f57703',
    );
    expect(transaction).toBeDefined;
    expect(transaction).not.toBeNull;
  });

  it('should get transaction from Polygon', async () => {
    const transaction = await service.getTransaction(
      Network.polygon,
      '0x4b9a08f9c6708f7ab19a07c28a8cf0c9aa0006e49d1df957d7c489b21bcd30a4',
    );
    expect(transaction).toBeDefined;
    expect(transaction).not.toBeNull;
  });
});

//

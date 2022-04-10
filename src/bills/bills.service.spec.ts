import { HttpModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import configuration from 'src/config/configuration';
import {
  closeInMongodConnection,
  rootMongooseTestModule,
} from 'src/utils/testing';
import { Web3Module } from 'src/web3/web3.module';
import { BillsImagesService } from './bills.images.service';
import { BillsService } from './bills.service';
import {
  BillsMetadata,
  BillsMetadataSchema,
} from './schema/billsMetadata.schema';

describe('BillsService', () => {
  let service: BillsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: BillsMetadata.name, schema: BillsMetadataSchema },
        ]),
        ConfigModule.forRoot({
          envFilePath: ['.development.env', '.env'],
          load: [configuration],
        }),
        Web3Module,
      ],
      providers: [BillsService, BillsImagesService],
    }).compile();

    service = module.get<BillsService>(BillsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should be load Bill data from transaction', async () => {
    const billData = await service.getBillDataFromTransaction(
      '0x7eab25d575507486589a1ca88ba18827e2b9b80cd495c6eec8963beba1f57703',
    );
    console.log(billData);
  });

  it('should get bill NFT transaction with tokenId', async () => {
    const billData = await service.getBillDataFromContractWithNftId({
      tokenId: 1,
    });
    console.log(billData);
  });

  it('should get bill NFT evemt transaction with tokenId', async () => {
    const billData = await service.fetchTokenIdMintEvent({ tokenId: 1 });
    console.log(billData);
  });

  it('should get bill NFT data  with tokenId', async () => {
    const billData = await service.getBillDataWithNftId({ tokenId: 1 });
    console.log(billData);
  });

  afterAll(async () => {
    await closeInMongodConnection();
  });
});

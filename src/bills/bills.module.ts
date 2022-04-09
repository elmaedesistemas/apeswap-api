import { HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Web3Module } from 'src/web3/web3.module';
import { BillsController } from './bills.controller';
import { BillsImagesService } from './bills.images.service';
import { BillsService } from './bills.service';
import {
  BillsMetadata,
  BillsMetadataSchema,
} from './schema/billsMetadata.schema';

@Module({
  imports: [
    Web3Module,
    HttpModule,
    MongooseModule.forFeature([
      { name: BillsMetadata.name, schema: BillsMetadataSchema },
    ]),
  ],
  controllers: [BillsController],
  providers: [BillsService, BillsImagesService],
})
export class BillsModule {}

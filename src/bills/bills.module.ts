import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BitqueryService } from 'src/bitquery/bitquery.service';
import { Web3Module } from 'src/web3/web3.module';
import { BillsController } from './bills.controller';
import { BillsImagesService } from './bills.images.service';
import { BillsService } from './bills.service';
import {
  BillsMetadata,
  BillsMetadataSchema,
} from './schema/billsMetadata.schema';
import {
  PairBitquery,
  PairBitquerySchema,
} from 'src/bitquery/schema/pairBitquery.schema';
import {
  TokenBitquery,
  TokenBitquerySchema,
} from 'src/bitquery/schema/tokenBitquery.schema';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,
    }),
    Web3Module,
    HttpModule,
    MongooseModule.forFeature([
      { name: BillsMetadata.name, schema: BillsMetadataSchema },
      { name: PairBitquery.name, schema: PairBitquerySchema },
      { name: TokenBitquery.name, schema: TokenBitquerySchema },
    ]),
  ],
  controllers: [BillsController],
  providers: [BillsService, BillsImagesService, BitqueryService],
  exports: [BitqueryService]
})
export class BillsModule {}

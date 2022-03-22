import { Module } from '@nestjs/common';
import { Web3Module } from 'src/web3/web3.module';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';

@Module({
  imports: [Web3Module],
  controllers: [BillsController],
  providers: [BillsService],
})
export class BillsModule {}

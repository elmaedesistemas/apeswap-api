import { Controller, Get, Logger, Param } from '@nestjs/common';
import { BillsService } from './bills.service';

@Controller('bills')
export class BillsController {
  private readonly logger = new Logger(BillsController.name);
  constructor(private billsService: BillsService) {}

  @Get('/bsc/:billId')
  async getBillData(@Param('billId') billId: number) {
    this.logger.debug(`Called GET /bills/bsc/${billId}`);
    return await this.billsService.getBillMetadata({ tokenId: +billId });
  }
}

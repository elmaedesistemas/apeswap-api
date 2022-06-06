import { Controller, Get, Logger, Param, Post } from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { BillSummaryDto } from './interface/billSumarry.dto';

@ApiTags('bills')
@Controller('bills')
export class BillsController {
  private readonly logger = new Logger(BillsController.name);
  constructor(private billsService: BillsService) {}

  @Get('/bsc/:billId')
  async getBillData(@Param('billId') billId: number) {
    this.logger.debug(`Called GET /bills/bsc/${billId}`);
    return await this.billsService.getBillMetadata({ tokenId: +billId });
  }

  @Get('/bsc/:billId/:transactionHash')
  async getBillDataWithTransactionHash(
    @Param('billId') billId: number,
    @Param('transactionHash') transactionHash: string,
  ) {
    this.logger.debug(`Called GET /bills/bsc/${billId}/${transactionHash}`);
    return await this.billsService.getBillMetadataWithHash({
      tokenId: +billId,
      transactionHash,
    });
  }

  @Get('/summary')
  async getBillSummary(): Promise<BillSummaryDto[]> {
    this.logger.debug('Called GET /bill/summary');
    return await this.billsService.getBillSummary();
  }
  
  @ApiExcludeEndpoint()
  @Post('/loading/price')
  async loadingBananaPrice() {
    this.logger.debug('Called GET /bill/summary');
    return await this.billsService.loadingBananaPriceAndUpdateBill();
  }
}

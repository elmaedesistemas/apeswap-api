import { Controller, Get, Logger, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BillsService } from './bills.service';
import { BillMetadataDto } from './interface/billData.dto';

@ApiTags('bills')
@Controller('bills')
export class BillsController {
  private readonly logger = new Logger(BillsController.name);
  constructor(private billsService: BillsService) {}

  @Get('/bsc/:billId')
  async getBillData(@Param('billId') billId: number): Promise<BillMetadataDto> {
    this.logger.debug(`Called GET /bills/bsc/${billId}`);
    return await this.billsService.getBillMetadata({ tokenId: +billId });
  }

  @Get('/bsc/:billId/:transactionHash')
  async getBillDataWithTransactionHash(
    @Param('billId') billId: number,
    @Param('transactionHash') transactionHash: string,
  ): Promise<BillMetadataDto> {
    this.logger.debug(`Called GET /bills/bsc/${billId}/${transactionHash}`);
    return await this.billsService.getBillMetadataWithHash({
      tokenId: +billId,
      transactionHash,
    });
  }
}

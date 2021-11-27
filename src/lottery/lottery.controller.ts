import {
  CacheInterceptor,
  Controller,
  Get,
  Logger,
  Param,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { ChainConfigService } from 'src/config/chain.configuration.service';
import { DrawingService } from './drawing.service';
import { LotteryService } from './lottery.service';

@Controller('lottery')
export class LotteryController {
  private readonly logger = new Logger(DrawingService.name);
  constructor(
    private configService: ChainConfigService,
    private lotteryService: LotteryService,
    private drawingService: DrawingService,
  ) {}
  chainId = this.configService.chainId;

  @ApiExcludeEndpoint()
  @UseInterceptors(CacheInterceptor)
  @Get()
  getLotteries(@Query() { pageSize, page }) {
    return this.lotteryService.getLotteries(pageSize, page);
  }

  @ApiExcludeEndpoint()
  @UseInterceptors(CacheInterceptor)
  @Get('history')
  getLotteryHistory() {
    return this.lotteryService.getLotteryHistory();
  }

  @ApiExcludeEndpoint()
  @Get('draw')
  async drawLottery() {
    try {
      if (this.chainId === 56) return;
      await this.drawingService.enterDrawing();
      await this.drawingService.draw();
      return 'success';
    } catch (e) {
      this.logger.error(e);
      return 'error';
    }
  }

  @ApiExcludeEndpoint()
  @Get('reset')
  async resetLottery() {
    try {
      if (this.chainId === 56) return;
      await this.drawingService.reset();
      return 'success';
    } catch (e) {
      this.logger.error(e);
      return 'error';
    }
  }

  @ApiExcludeEndpoint()
  @Get('process')
  async processLottery() {
    try {
      if (this.chainId === 56) return;
      return this.drawingService.process();
    } catch (e) {
      this.logger.error(e);
      return 'error';
    }
  }

  @ApiExcludeEndpoint()
  @Get('config')
  @UseInterceptors(CacheInterceptor)
  async config() {
    try {
      return this.lotteryService.getConfig();
    } catch (e) {
      this.logger.error(e);
      return 'error';
    }
  }

  @ApiExcludeEndpoint()
  @Get('next')
  @UseInterceptors(CacheInterceptor)
  async nextDraw() {
    try {
      return this.drawingService.getNextLotteryDrawTime();
    } catch (e) {
      this.logger.error(e);
      return 'error';
    }
  }

  @ApiExcludeEndpoint()
  @UseInterceptors(CacheInterceptor)
  @Get(':id')
  getLottery(@Param('id') id: number) {
    return this.lotteryService.getLottery(id);
  }
}

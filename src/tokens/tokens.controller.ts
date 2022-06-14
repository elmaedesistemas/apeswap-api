import {
  CacheInterceptor,
  Controller,
  Get,
  Logger,
  Param,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { TokenList } from 'src/interfaces/tokens/tokenList.dto';
import { SentryInterceptor } from 'src/interceptor/sentry.interceptor';
import { TokensService } from './tokens.service';
import { Token } from 'src/interfaces/tokens/token.dto';

@ApiTags('tokens')
@Controller('tokens')
@UseInterceptors(CacheInterceptor, SentryInterceptor)
export class TokensController {
  private readonly logger = new Logger(TokensController.name);
  constructor(private tokensService: TokensService) {}

  @ApiOkResponse({
    type: TokenList,
  })
  @Get()
  async getAllTokens(): Promise<TokenList[]> {
    this.logger.log('Called GET /tokens');
    return await this.tokensService.getAllTokens();
  }
  
  @Get('trending')
  async getTokensTrending(): Promise<Token[]> {
    this.logger.log('Called GET /tokens/trending');
    return this.tokensService.getTokensTrending();
  }

  @Get(':type')
  async getTokensPerType(@Param('type') type: string): Promise<Token[]> {
    this.logger.log('Called GET /tokens/:type');
    return this.tokensService.getTokensFromType(type);
  }
}

import { Module, HttpModule, CacheModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChainConfigService } from 'src/config/chain.configuration.service';
import { BitqueryController } from './bitquery.controller';
import { BitqueryService } from './bitquery.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,
    }),
    ConfigModule.forRoot({
      envFilePath: ['.development.env', '.env'],
      isGlobal: true,
    }),
    HttpModule,
  ],
  providers: [BitqueryService, ChainConfigService],
  controllers: [BitqueryController],
})
export class BitqueryModule {}

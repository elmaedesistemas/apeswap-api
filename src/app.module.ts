import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PairsModule } from './pairs/pairs.module';
import { LotteryModule } from './lottery/lottery.module';
import { StatsModule } from './stats/stats.module';
import { TokensModule } from './tokens/tokens.module';
import { NfasModule } from './nfas/nfas.module';
import { ApestrongModule } from './apestrong/apestrong.module';
import configuration from './config/configuration';
import { TradingModule } from './trading/trading.module';
import { IazoModule } from './iazo/iazo.module';
import { CloudinaryModule } from './services/cloudinary/cloudinary.module';
import { Cloudinary } from './services/cloudinary/cloudinary';
import { MailgunModule } from './services/mailgun/mailgun.module';
import { AuthStrapiMiddleware } from './middleware/auth-strapi';
import { BitqueryModule } from './bitquery/bitquery.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.development.env', '.env'],
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URL, { useCreateIndex: true }),
    PairsModule,
    LotteryModule,
    StatsModule,
    TokensModule,
    NfasModule,
    TradingModule,
    ApestrongModule,
    IazoModule,
    CloudinaryModule,
    MailgunModule,
    BitqueryModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 100,
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService, 
    Cloudinary,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthStrapiMiddleware)
      .forRoutes(
        { path: 'iazo/staff', method: RequestMethod.GET },
        { path: 'iazo/staff', method: RequestMethod.POST },
      );
  }
}

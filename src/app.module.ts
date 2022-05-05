import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { StatsModule } from './stats/stats.module';
import { TokensModule } from './tokens/tokens.module';
import { NfasModule } from './nfas/nfas.module';
import configuration from './config/configuration';
import { IazoModule } from './iazo/iazo.module';
import { CloudinaryModule } from './services/cloudinary/cloudinary.module';
import { Cloudinary } from './services/cloudinary/cloudinary';
import { MailgunModule } from './services/mailgun/mailgun.module';
import { AuthStrapiMiddleware } from './middleware/auth-strapi';
import { BitqueryModule } from './bitquery/bitquery.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { BillsModule } from './bills/bills.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.development.env', '.env'],
      load: [configuration],
      isGlobal: true,
    }),
    MongooseModule.forRoot(process.env.MONGO_URL, { useCreateIndex: true }),
    StatsModule,
    TokensModule,
    NfasModule,
    IazoModule,
    CloudinaryModule,
    MailgunModule,
    BitqueryModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 500,
    }),
    BillsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Cloudinary,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
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

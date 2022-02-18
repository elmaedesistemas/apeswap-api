import { CacheModule, Module, HttpModule } from '@nestjs/common';
import { StatsService } from './stats.service';
import { SubgraphService } from './subgraph.service';
import { PriceService } from './price.service';
import { StatsController } from './stats.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { GeneralStats, GeneralStatsSchema } from './schema/generalStats.schema';
import { TvlStats, TvlStatsSchema } from './schema/tvlStats.schema';
import { StatsNetworkService } from './stats.network.service';
import {
  GeneralStatsNetwork,
  GeneralStatsNetworkSchema,
} from './schema/generalStatsNetwork.schema';

@Module({
  imports: [
    CacheModule.register({
      ttl: 60,
    }),
    HttpModule,
    MongooseModule.forFeature([
      { name: GeneralStats.name, schema: GeneralStatsSchema },
      { name: TvlStats.name, schema: TvlStatsSchema },
      { name: GeneralStatsNetwork.name, schema: GeneralStatsNetworkSchema },
    ]),
  ],
  providers: [StatsService, SubgraphService, PriceService, StatsNetworkService],
  exports: [SubgraphService],
  controllers: [StatsController],
})
export class StatsModule {}

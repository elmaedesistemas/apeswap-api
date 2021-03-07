import { Injectable, HttpService } from '@nestjs/common';

import { getAllStats, getWalletStats, getBurntBananas } from './utils/stats.utils';

@Injectable()
export class StatsService {
  constructor(private httpService: HttpService) {}

  async getAllStats(): Promise<any> {
    return getAllStats(this.httpService);
  }

  async getStatsForWallet(wallet): Promise<any> {
    return getWalletStats(this.httpService, wallet);
  }

  async getBurntBanana(): Promise<any> {
    return getBurntBananas();
  }
}

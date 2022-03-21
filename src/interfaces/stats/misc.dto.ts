export class MainNetworkPriceDto {
    price: number;
    priceOneDay: number;
    priceChange: number;
}

export class TimestampChangeDto {
    oneDay: number;
    twoDay: number;
    oneWeek: number;
}

export class DayPercentChangeDto {
    currentChange: number;
    adjustedPercentChange: number;
}

export class TokenVolume {
    smartContract: {
        address: {
            address: string;
        }
    };
    oneWeekVolumeUSD: number;
    volumeUSD: number;
    volumeChangeUSD: number;
    oneDayVolumeUntracked: number;
    volumeChangeUntracked: number;
    tradeAmount: number;
    trackedReserveUSD: number;
    trackedReserveETH: number;
    liquidityChangeUSD: number;
    reserveUSD: number;
    createdAtBlockNumber: number;
}
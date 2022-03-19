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
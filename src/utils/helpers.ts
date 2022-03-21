import dayjs from 'dayjs';
import { DayPercentChangeDto, TimestampChangeDto, TokenVolume } from 'src/interfaces/stats/misc.dto';

export function getParameterCaseInsensitive(object, key) {
  return object[
    Object.keys(object).find((k) => k.toLowerCase() === key.toLowerCase())
  ];
}

/**
 * Given 2 token symbols, create LP-Pair name based on the following rules (in priority):
 * 1) BANANA comes first
 * 2) BUSD comes second
 * 3) BNB comes second
 * 4) Sort alphabetically
 */
export function createLpPairName(t0, t1) {
  if (t0 == 'BANANA' || t1 == 'BANANA') {
    return t0 == 'BANANA' ? `[${t0}]-[${t1}] LP` : `[${t1}]-[${t0}] LP`;
  }

  if (t0 == 'BUSD' || t1 == 'BUSD') {
    return t0 == 'BUSD' ? `[${t1}]-[${t0}] LP` : `[${t0}]-[${t1}] LP`;
  }

  if (t0 == 'WBNB' || t0 == 'BNB') {
    return `[${t1}]-[${t0}] LP`;
  }
  if (t1 == 'WBNB' || t1 == 'BNB') {
    return `[${t0}]-[${t1}] LP`;
  }

  return t0.toLowerCase() < t1.toLowerCase()
    ? `[${t0}]-[${t1}] LP`
    : `[${t1}]-[${t0}] LP`;
}

export function getTimestampsForChanges(): TimestampChangeDto {
  const utcCurrentTime = dayjs();
  const oneDay = utcCurrentTime.subtract(1, 'day').startOf('minute').unix();
  const twoDay = utcCurrentTime.subtract(2, 'day').startOf('minute').unix();
  const oneWeek = utcCurrentTime.subtract(1, 'week').startOf('minute').unix();
  return { oneDay, twoDay, oneWeek };
}

export const getPercentChange = (valueNow, value24HoursAgo) => {
  const adjustedPercentChange =
    ((parseFloat(valueNow) - parseFloat(value24HoursAgo)) /
      parseFloat(value24HoursAgo)) *
    100;
  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return 0;
  }
  return adjustedPercentChange;
};

const get2DayPercentChange = (
  valueNow,
  value24HoursAgo,
  value48HoursAgo,
): DayPercentChangeDto => {
  // get volume info for both 24 hour periods
  const currentChange: number =
    parseFloat(valueNow) - parseFloat(value24HoursAgo);
  const previousChange: number =
    parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo);

  const adjustedPercentChange =
    (currentChange - previousChange / previousChange) * 100;

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return {currentChange, adjustedPercentChange: 0};
  }
  return { currentChange, adjustedPercentChange };
};

export function parseData(data, oneDayData, twoDayData, oneWeekData, price, oneDayBlock): TokenVolume {
  // get volume changes
  const { currentChange: oneDayVolumeUSD, adjustedPercentChange: volumeChangeUSD} = get2DayPercentChange(
    data?.volumeUSD,
    oneDayData?.volumeUSD ? oneDayData.volumeUSD : 0,
    twoDayData?.volumeUSD ? twoDayData.volumeUSD : 0,
  );
  const {currentChange: oneDayVolumeUntracked, adjustedPercentChange: volumeChangeUntracked} = get2DayPercentChange(
    data?.untrackedVolumeUSD,
    oneDayData?.untrackedVolumeUSD
      ? parseFloat(oneDayData?.untrackedVolumeUSD)
      : 0,
    twoDayData?.untrackedVolumeUSD ? twoDayData?.untrackedVolumeUSD : 0,
  );
  data.oneWeekVolumeUSD = parseFloat(
    oneWeekData ? data?.volumeUSD - oneWeekData?.volumeUSD : data.volumeUSD,
  );

  // set volume properties
  data.volumeChangeUSD = volumeChangeUSD;
  data.oneDayVolumeUntracked = oneDayVolumeUntracked;
  data.volumeChangeUntracked = volumeChangeUntracked;
  data.tradeAmount = oneDayVolumeUSD;

  // set liquiditry properties
  data.trackedReserveUSD = data.trackedReserveETH * price;
  data.liquidityChangeUSD = getPercentChange(
    data.reserveUSD,
    oneDayData?.reserveUSD,
  );

  // format if pair hasnt existed for a day or a week
  if (!oneDayData && data && data.createdAtBlockNumber > oneDayBlock) {
    data.tradeAmount = parseFloat(data.volumeUSD);
  }
  if (!oneDayData && data) {
    data.tradeAmount = parseFloat(data.volumeUSD);
  }
  if (!oneWeekData && data) {
    data.oneWeekVolumeUSD = parseFloat(data.volumeUSD);
  }

  return data;
}

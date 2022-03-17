import dayjs from 'dayjs';

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

export function getTimestampsForChanges() {
  const utcCurrentTime = dayjs();
  const t1 = utcCurrentTime.subtract(1, 'day').startOf('minute').unix();
  const t2 = utcCurrentTime.subtract(2, 'day').startOf('minute').unix();
  const tWeek = utcCurrentTime.subtract(1, 'week').startOf('minute').unix();
  return [t1, t2, tWeek];
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

export const get2DayPercentChange = (
  valueNow,
  value24HoursAgo,
  value48HoursAgo,
) => {
  // get volume info for both 24 hour periods
  const currentChange: number =
    parseFloat(valueNow) - parseFloat(value24HoursAgo);
  const previousChange: number =
    parseFloat(value24HoursAgo) - parseFloat(value48HoursAgo);

  const adjustedPercentChange =
    (currentChange - previousChange / previousChange) * 100;

  if (isNaN(adjustedPercentChange) || !isFinite(adjustedPercentChange)) {
    return [currentChange, 0];
  }
  return [currentChange, adjustedPercentChange];
};

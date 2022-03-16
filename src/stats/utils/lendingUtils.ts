import { ethers } from 'ethers';

export function calculateSupplyAndBorrowApys(
  borrowRatePerBlock,
  underlyingPrice,
  underlyingDecimals,
  totalSupply,
  cTokenDecimals,
  exchangeRateCurrent,
  totalBorrows,
  reserveFactorMantissa,
): { borrowApyPercent: number; supplyApyPercent: number } {
  // Preparations For borrow APY calculations
  const borrowRateInUnits = parseFloat(
    // Note : 'borrowRatePerBlock' is actually 'borrowRatePerSecond'
    ethers.utils.formatUnits(borrowRatePerBlock),
  );
  // Note : Seconds in a year
  const interestUnitsPerYear = 60 * 60 * 24 * 365;

  const borrowAprInUnits = borrowRateInUnits * interestUnitsPerYear;

  // Calculate the compounding borrow APY
  const compoundsPerYear = 365;
  const base = borrowAprInUnits / compoundsPerYear + 1;
  const powered = Math.pow(base, compoundsPerYear);
  const borrowApyInUnits = powered - 1;
  const borrowApyPercent = borrowApyInUnits * 100;

  // Preparations For Supply APY calculations
  const underlyingUsdPrice = parseFloat(
    ethers.utils.formatUnits(underlyingPrice, 36 - underlyingDecimals),
  );
  const cTokensInCirculation = parseFloat(
    ethers.utils.formatUnits(totalSupply, cTokenDecimals),
  );
  const exchangeRateInUnits = parseFloat(
    ethers.utils.formatUnits(
      exchangeRateCurrent,
      parseInt(underlyingDecimals) + 10,
    ),
  );
  const totalSuppliedInUnits = cTokensInCirculation * exchangeRateInUnits;
  const totalSupplyBalanceUsd = totalSuppliedInUnits * underlyingUsdPrice;

  const totalBorrowedInUnits = parseFloat(
    ethers.utils.formatUnits(totalBorrows, underlyingDecimals),
  );
  const reservesFactorInUnits = parseFloat(
    ethers.utils.formatEther(reserveFactorMantissa),
  );

  const marketYearlySupplySideInterestUnitsWithCompounding =
    borrowApyPercent * totalBorrowedInUnits * (1 - reservesFactorInUnits);

  const marketYearlySupplySideInterestUsdWithCompounding =
    marketYearlySupplySideInterestUnitsWithCompounding * underlyingUsdPrice;

  const supplyApyPercent =
    marketYearlySupplySideInterestUsdWithCompounding / totalSupplyBalanceUsd;

  return {
    borrowApyPercent,
    supplyApyPercent,
  };
}

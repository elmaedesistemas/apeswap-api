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
  incentiveSupplySpeed,
  incentiveBorrowSpeed,
  bananaPrice,
): { borrowApyPercent: number; supplyApyPercent: number, supplyDistributionApyPercent: number, borrowDistributionApyPercent: number } {
  // Preparations For borrow APY calculations
  const borrowRateInUnits = parseFloat(
    // Note : 'borrowRatePerBlock' is actually 'borrowRatePerSecond'
    ethers.utils.formatUnits(borrowRatePerBlock),
  );
  const incentiveSupplySpeedUnits = parseFloat(
    // Note : 'borrowRatePerBlock' is actually 'borrowRatePerSecond'
    ethers.utils.formatUnits(incentiveSupplySpeed),
  );
  const incentiveBorrowSpeedUnits = parseFloat(
    // Note : 'borrowRatePerBlock' is actually 'borrowRatePerSecond'
    ethers.utils.formatUnits(incentiveBorrowSpeed),
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
  
  const BlockPerYear = 20 * 60 * 24 * 365;
  const totalBorrowBalanceUsd = totalBorrowedInUnits * underlyingUsdPrice;

  const incentiveSupplyPerYear = incentiveSupplySpeedUnits * BlockPerYear;
  const incentiveSupplyPerYearUsd = incentiveSupplyPerYear * bananaPrice;
  const supplyDistributionApyPercent = incentiveSupplyPerYearUsd * 100 / totalSupplyBalanceUsd;
  
  const incentiveBorrowPerYear = incentiveBorrowSpeedUnits * BlockPerYear;
  const incentiveBorrowPerYearUsd = incentiveBorrowPerYear * bananaPrice;
  const borrowDistributionApyPercent = incentiveBorrowPerYearUsd * 100 / totalBorrowBalanceUsd;
  
  return {
    borrowApyPercent,
    supplyApyPercent,
    supplyDistributionApyPercent,
    borrowDistributionApyPercent
  };
}

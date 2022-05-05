export const CUSTOM_BILL_ABI = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'deposit',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'payout',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'expires',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'billId',
        type: 'uint256',
      },
    ],
    name: 'BillCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'controlVariable',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'vestingTerm',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'minimumPrice',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'maxPayout',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'maxDebt',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'maxTotalPayout',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'initialDebt',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'lastDecay',
        type: 'uint256',
      },
    ],
    name: 'BillInitialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'internalPrice',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'uint256',
        name: 'debtRatio',
        type: 'uint256',
      },
    ],
    name: 'BillPriceChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'uint256',
        name: 'billId',
        type: 'uint256',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'recipient',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'payout',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'remaining',
        type: 'uint256',
      },
    ],
    name: 'BillRedeemed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'initialBCV',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newBCV',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'adjustment',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'addition',
        type: 'bool',
      },
    ],
    name: 'ControlVariableAdjustment',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'newMaxTotalPayout',
        type: 'uint256',
      },
    ],
    name: 'MaxTotalPayoutChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newPolicy',
        type: 'address',
      },
    ],
    name: 'PolicyPushed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'PolicyTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'redeemer',
        type: 'address',
      },
      {
        indexed: false,
        internalType: 'bool',
        name: 'approved',
        type: 'bool',
      },
    ],
    name: 'RedeemerToggled',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bool',
        name: 'addition',
        type: 'bool',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'increment',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'target',
        type: 'uint256',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'buffer',
        type: 'uint256',
      },
    ],
    name: 'SetAdjustment',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'payoutSinceLastSubsidy',
        type: 'uint256',
      },
    ],
    name: 'SubsidyPaid',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'enum CustomBill.PARAMETER',
        name: 'parameer',
        type: 'uint8',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'input',
        type: 'uint256',
      },
    ],
    name: 'TermsSet',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'newTreasury',
        type: 'address',
      },
    ],
    name: 'TreasuryChanged',
    type: 'event',
  },
  {
    inputs: [],
    name: 'DAO',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'adjustment',
    outputs: [
      {
        internalType: 'bool',
        name: 'add',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: 'rate',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'target',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'buffer',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lastBlockTimestamp',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'billInfo',
    outputs: [
      {
        internalType: 'uint256',
        name: 'payout',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'vesting',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'lastBlockTimestamp',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'truePricePaid',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'billNft',
    outputs: [
      {
        internalType: 'contract IBillNft',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'customTreasury',
    outputs: [
      {
        internalType: 'contract ICustomTreasury',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'feeInPayout',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    name: 'feeTiers',
    outputs: [
      {
        internalType: 'uint256',
        name: 'tierCeilings',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'fees',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'lastDecay',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'maxTotalPayout',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'newPolicy',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'payoutSinceLastSubsidy',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'payoutToken',
    outputs: [
      {
        internalType: 'contract IERC20MetadataUpgradeable',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'policy',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'principalToken',
    outputs: [
      {
        internalType: 'contract IERC20Upgradeable',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'pullPolicy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newPolicy_',
        type: 'address',
      },
    ],
    name: 'pushPolicy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    name: 'redeemerApproved',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'renouncePolicy',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'subsidyRouter',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'terms',
    outputs: [
      {
        internalType: 'uint256',
        name: 'controlVariable',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'vestingTerm',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'minimumPrice',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxPayout',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'maxDebt',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'totalDebt',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'totalPayoutGiven',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'totalPrincipalBilled',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address[7]',
        name: '_config',
        type: 'address[7]',
      },
      {
        internalType: 'uint256[]',
        name: '_tierCeilings',
        type: 'uint256[]',
      },
      {
        internalType: 'uint256[]',
        name: '_fees',
        type: 'uint256[]',
      },
      {
        internalType: 'bool',
        name: '_feeInPayout',
        type: 'bool',
      },
    ],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_controlVariable',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_vestingTerm',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_minimumPrice',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_maxPayout',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_maxDebt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_maxTotalPayout',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_initialDebt',
        type: 'uint256',
      },
    ],
    name: 'initializeBill',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'enum CustomBill.PARAMETER',
        name: '_parameter',
        type: 'uint8',
      },
      {
        internalType: 'uint256',
        name: '_input',
        type: 'uint256',
      },
    ],
    name: 'setBillTerms',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_maxTotalPayout',
        type: 'uint256',
      },
    ],
    name: 'setMaxTotalPayout',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: '_addition',
        type: 'bool',
      },
      {
        internalType: 'uint256',
        name: '_increment',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_target',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_buffer',
        type: 'uint256',
      },
    ],
    name: 'setAdjustment',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_treasury',
        type: 'address',
      },
    ],
    name: 'changeTreasury',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'paySubsidy',
    outputs: [
      {
        internalType: 'uint256',
        name: 'payoutSinceLastSubsidy_',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_maxPrice',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: '_depositor',
        type: 'address',
      },
    ],
    name: 'deposit',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_billId',
        type: 'uint256',
      },
    ],
    name: 'redeem',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256[]',
        name: '_billIds',
        type: 'uint256[]',
      },
    ],
    name: 'batchRedeem',
    outputs: [
      {
        internalType: 'uint256',
        name: 'payout',
        type: 'uint256',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'redeemer',
        type: 'address',
      },
    ],
    name: 'toggleRedeemer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'billPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: 'price_',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'trueBillPrice',
    outputs: [
      {
        internalType: 'uint256',
        name: 'price_',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'maxPayout',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_value',
        type: 'uint256',
      },
    ],
    name: 'payoutFor',
    outputs: [
      {
        internalType: 'uint256',
        name: '_payout',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_fee',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'debtRatio',
    outputs: [
      {
        internalType: 'uint256',
        name: 'debtRatio_',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'currentDebt',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'debtDecay',
    outputs: [
      {
        internalType: 'uint256',
        name: 'decay_',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_billId',
        type: 'uint256',
      },
    ],
    name: 'percentVestedFor',
    outputs: [
      {
        internalType: 'uint256',
        name: 'percentVested_',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_billId',
        type: 'uint256',
      },
    ],
    name: 'pendingPayoutFor',
    outputs: [
      {
        internalType: 'uint256',
        name: 'pendingPayout_',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'userBillIds',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
    ],
    name: 'getBillIds',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'user',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'start',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'end',
        type: 'uint256',
      },
    ],
    name: 'getBillIdsInRange',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'currentFee',
    outputs: [
      {
        internalType: 'uint256',
        name: 'currentFee_',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
  {
    inputs: [],
    name: 'allIssuedBillIds',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
    constant: true,
  },
];

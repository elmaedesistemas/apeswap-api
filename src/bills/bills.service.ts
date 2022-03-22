import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';
import { Network } from 'src/web3/network.enum';
import { Web3Service } from 'src/web3/web3.service';
import { BillNft_abi } from './abi/BillNft.abi';
import { CustomBill_abi } from './abi/CustomBill.abi';
import { BillData, BillTerms } from './interface/billData.interface';

@Injectable()
export class BillsService {
  logger = new Logger(BillsService.name);

  // TODO: move to config file
  billNftContractAddress = '0xa863950f8bd810aa597d7a731d6a73fb608de9b6';

  terms: { [key: string]: BillTerms } = {};

  constructor(private web3: Web3Service, private config: ConfigService) {
    this.listenToEvents();
  }

  async getBillDataFromTransaction(transactionHash: string) {
    const transaction = await this.web3.getTransaction(
      Network.bsc,
      transactionHash,
    );
    const billContract = transaction.to;

    // Decode event log
    const iface = new utils.Interface(CustomBill_abi);
    const event = {
      data: transaction.logs[6].data,
      topics: transaction.logs[6].topics,
    };
    const eventLog = iface.parseLog(event);

    const { terms, payoutToken, principalToken } = await this.getBillTerms(
      billContract,
    );

    const billData: BillData = {
      billContract,
      payout: new BigNumber(eventLog.args.payout.toString())
        .div(new BigNumber(10).pow(18))
        .toNumber(),
      deposit: new BigNumber(eventLog.args.deposit.toString())
        .div(new BigNumber(10).pow(18))
        .toNumber(),
      billNftId: eventLog.args.billId.toNumber(),
      expires: eventLog.args.expires.toNumber(),
      vestingPeriodSeconds: terms.vestingTerm,
      payoutToken: payoutToken,
      principalToken: principalToken,
    };

    return { transaction, eventLog, billData };
  }

  async getBillTerms(contractAddress: string): Promise<BillTerms> {
    if (!this.terms[contractAddress])
      this.terms[contractAddress] = await this.getBillTermsFromContract(
        contractAddress,
      );
    return this.terms[contractAddress];
  }

  async getBillTermsFromContract(contractAddress: string): Promise<BillTerms> {
    const contract = this.web3.getContract(
      Network.bsc,
      CustomBill_abi,
      contractAddress,
    );
    // TODO: multicall this?
    const [terms, payoutToken, principalToken] = await Promise.all([
      contract.methods.terms().call(),
      contract.methods.payoutToken().call(),
      contract.methods.principalToken().call(),
    ]);
    return { terms, payoutToken, principalToken };
  }

  async getBillDataWithNftId({ tokenId }) {
    const event = await this.fetchTokenIdMintEvent({ tokenId });
    const { billData } = await this.getBillDataFromTransaction(
      event[0].transactionHash,
    );
    return billData;
  }

  async fetchTokenIdMintEvent({ tokenId }) {
    const contract = this.web3.getEthersContract(
      Network.bsc,
      BillNft_abi,
      this.billNftContractAddress,
    );
    const filters = contract.filters.Transfer(
      '0x0000000000000000000000000000000000000000',
      '0x0341242eb1995a9407f1bf632e8da206858fbb3a',
      tokenId,
    );
    // TODO: put BillNft deployment block
    filters.fromBlock = 0;
    const events = await this.web3
      .getArchiveRpcClient(Network.bsc)
      .getLogs(filters);
    return events;
  }

  async listenToEvents() {
    this.logger.log('Listening to bill mint events');
    const contract = this.web3.getEthersContract(
      Network.bsc,
      BillNft_abi,
      this.billNftContractAddress,
    );
    const filter = contract.filters.Transfer(
      '0x0000000000000000000000000000000000000000',
    );
    this.web3.getRpcClient(Network.bsc).on(filter, async (event) => {
      this.logger.log('BillNft mint event triggered');
      const billData = await this.getBillDataFromTransaction(
        event.transactionHash,
      );
      console.log(billData);
    });
  }

  // TODO: evaluate need for this function ~ consider removal
  async getBillDataFromContractWithNftId({ tokenId }) {
    const billNftContract = this.web3.getContract(
      Network.bsc,
      BillNft_abi,
      this.billNftContractAddress,
    );
    const billAddress = await billNftContract.methods
      .billAddresses(tokenId)
      .call();
    console.log(billAddress);
    const { terms, payoutToken, principalToken } = await this.getBillTerms(
      billAddress,
    );
    const billContract = this.web3.getContract(
      Network.bsc,
      CustomBill_abi,
      billAddress,
    );
    const billInfo = await billContract.methods.billInfo(tokenId).call();
    const billData: BillData = {
      billContract,
      payout: new BigNumber(billInfo.payout.toString())
        .div(new BigNumber(10).pow(18))
        .toNumber(),
      /*deposit: new BigNumber(eventLog.args.deposit.toString())
        .div(new BigNumber(10).pow(18))
        .toNumber(), */
      billNftId: tokenId,
      expires: billInfo.vesting + billInfo.lastBlockTimestamp,
      vestingPeriodSeconds: terms.vestingTerm,
      payoutToken: payoutToken,
      principalToken: principalToken,
    };
    return billData;
  }
}

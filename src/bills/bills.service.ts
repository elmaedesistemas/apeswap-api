import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';
import { Model } from 'mongoose';
import { Network } from 'src/web3/network.enum';
import { Web3Service } from 'src/web3/web3.service';
import { BillNft_abi } from './abi/BillNft.abi';
import { CustomBill_abi } from './abi/CustomBill.abi';
import { BillData, BillTerms } from './interface/billData.interface';
import {
  BillsMetadata,
  BillsMetadataDocument,
} from './schema/billsMetadata.schema';

@Injectable()
export class BillsService {
  logger = new Logger(BillsService.name);

  // TODO: move to config file
  billNftContractAddress = '0xb0278e43dbd744327fe0d5d0aba4a77cbfc7fad8';

  terms: { [key: string]: BillTerms } = {};

  constructor(
    private web3: Web3Service,
    private config: ConfigService,
    @InjectModel(BillsMetadata.name)
    public billMetadataModel: Model<BillsMetadataDocument>,
  ) {
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

  async getBillMetadata({ tokenId }) {
    let billMetadata = await this.billMetadataModel.findOne({ tokenId });
    if (!billMetadata) {
      this.logger.log(`Loading bill ${tokenId}`);
      const billData = await this.getBillDataWithNftId({ tokenId });
      const newBillMetadata: BillsMetadata = {
        name: `Treasury Bill #${tokenId}`,
        description: `Treasury Bill #${tokenId}`,
        attributes: [
          {
            trait_type: 'Layer 1',
            value: 'Prop 1',
          },
          {
            trait_type: 'Layer 2',
            value: 'Prop 1',
          },
          {
            trait_type: 'Layer 3',
            value: 'Prop 1',
          },
          {
            trait_type: 'Layer 4',
            value: 'Prop 1',
          },
          {
            trait_type: 'Layer 5',
            value: 'Prop 1',
          },
        ],
        data: billData,
        tokenId,
        contractAddress: this.billNftContractAddress,
        image: 'https://i.imgur.com/daRKjBB.png',
      };
      billMetadata = await this.billMetadataModel.create(newBillMetadata);
    }
    return billMetadata;
  }

  async fetchTokenIdMintEvent({ tokenId }) {
    const contract = this.web3.getEthersContract(
      Network.bsc,
      BillNft_abi,
      this.billNftContractAddress,
    );
    const filters = contract.filters.Transfer(
      '0x0000000000000000000000000000000000000000',
      null,
      tokenId,
    );
    // TODO: put BillNft deployment block
    filters.fromBlock = 16543530;
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

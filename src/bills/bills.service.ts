import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import BigNumber from 'bignumber.js';
import { utils } from 'ethers';
import { Model } from 'mongoose';
import sleep from 'sleep-promise';
import { BitqueryService } from 'src/bitquery/bitquery.service';
import { createLpPairName } from 'src/utils/helpers';
import { Network } from 'src/web3/network.enum';
import { Web3Service } from 'src/web3/web3.service';
import { BillNft_abi } from './abi/BillNft.abi';
import { CUSTOM_BILL_ABI } from './abi/CustomBill.abi';
import { BillsImagesService } from './bills.images.service';
import { BillData, BillTerms } from './interface/billData.interface';
import { generateAttributes, generateV1Attributes } from './random.layers';
import {
  BillsMetadata,
  BillsMetadataDocument,
} from './schema/billsMetadata.schema';
import { getLpInfo } from './token.helper';
import { BillSummaryDto } from './interface/billSumarry.dto';

@Injectable()
export class BillsService {
  logger = new Logger(BillsService.name);

  // TODO: move to config file
  billNftContractAddress = '0xb0278e43dbd744327fe0d5d0aba4a77cbfc7fad8';

  terms: { [key: string]: BillTerms } = {};

  // Used to check if other create transaction is running on state
  billCreations = {};

  constructor(
    private web3: Web3Service,
    private config: ConfigService,
    private image: BillsImagesService,
    @InjectModel(BillsMetadata.name)
    public billMetadataModel: Model<BillsMetadataDocument>,
    private bitqueryService: BitqueryService,
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
    const iface = new utils.Interface(CUSTOM_BILL_ABI);
    const event = {
      data: transaction.logs[6].data,
      topics: transaction.logs[6].topics,
    };
    const eventLog = iface.parseLog(event);

    const { terms, payoutToken, principalToken } = await this.getBillTerms(
      billContract,
    );

    const lpData = await getLpInfo(
      principalToken,
      payoutToken,
      this.config.get<string>(`56.apePriceGetter`),
    );
    const bananaAddress = this.config.get<string>(`56.contracts.banana`);

    const deposit = new BigNumber(eventLog.args.deposit.toString())
      .div(new BigNumber(10).pow(18))
      .toNumber();

    const billData: BillData = {
      billContract,
      payout: new BigNumber(eventLog.args.payout.toString())
        .div(new BigNumber(10).pow(18))
        .toNumber(),
      deposit,
      createTransactionHash: transactionHash,
      billNftId: eventLog.args.billId.toNumber(),
      expires: eventLog.args.expires.toNumber(),
      vestingPeriodSeconds: parseInt(terms.vestingTerm),
      payoutToken: payoutToken,
      principalToken: principalToken,
      type:
        payoutToken.toLowerCase() === bananaAddress.toLowerCase()
          ? 'Banana'
          : 'Jungle',
      pairName: createLpPairName(lpData.token0.symbol, lpData.token1.symbol),
      payoutTokenData: lpData.payoutToken,
      token0: lpData.token0,
      token1: lpData.token1,
      dollarValue: lpData.lpPrice * deposit,
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
      CUSTOM_BILL_ABI,
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

  async getBillDataWithNftId({ tokenId, attempt = 0 }) {
    try {
      const event = await this.fetchTokenIdMintEvent({ tokenId });
      const { billData } = await this.getBillDataFromTransaction(
        event[0].transactionHash,
      );
      return billData;
    } catch (e) {
      this.logger.error(`Something went wrong getting bill data with NFT`);
      this.logger.error(e);
      if (attempt < 5) {
        this.logger.log(`Retrying - Attempt: ${attempt}`);
        await sleep(100 * attempt);
        return this.getBillDataWithNftId({ tokenId, attempt: attempt + 1 });
      }
      throw e;
    }
  }

  async getBillMetadata({ tokenId }) {
    let billMetadata = await this.billMetadataModel.findOne(
      { tokenId },
      '-_id',
    );
    if (!billMetadata) {
      this.logger.log(`Loading bill ${tokenId}`);
      const billData = await this.getBillDataWithNftId({ tokenId });
      if (!this.billCreations[billData.createTransactionHash]) {
        this.billCreations[billData.createTransactionHash] =
          this.createNewBill(billData);
      }
      billMetadata = await this.billCreations[
        billData.createTransactionHash
      ].catch(() => {
        delete this.billCreations[billData.createTransactionHash];
        throw new InternalServerErrorException();
      });
      delete this.billCreations[billData.createTransactionHash];
    }
    return billMetadata;
  }

  async getBillMetadataWithHash({ transactionHash, tokenId, attempt = 0 }) {
    let billMetadata = await this.billMetadataModel.findOne(
      { tokenId },
      '-_id',
    );
    if (!billMetadata) {
      try {
        this.logger.log(`Loading bill ${tokenId}`);
        if (!this.billCreations[transactionHash]) {
          const { billData } = await this.getBillDataFromTransaction(
            transactionHash,
          );
          billMetadata = await this.createNewBill(billData);
        } else billMetadata = await this.billCreations[transactionHash];
      } catch (e) {
        this.logger.error(
          `Something went wrong creating bill data with transation hash`,
        );
        this.logger.error(e);
        if (attempt < 5) {
          this.logger.log(`Retrying - Attempt: ${attempt}`);
          await sleep(100 * attempt);
          return this.getBillMetadataWithHash({
            transactionHash,
            tokenId,
            attempt: attempt + 1,
          });
        }
        throw e;
      }
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
      if (!this.billCreations[event.transactionHash]) {
        const { billData } = await this.getBillDataFromTransaction(
          event.transactionHash,
        );
        this.billCreations[event.transactionHash] =
          this.createNewBill(billData);
        await this.billCreations[event.transactionHash].catch();
        delete this.billCreations[event.transactionHash];
      }
    });
  }

  async createNewBill(billData: BillData) {
    const attributes =
      billData.billNftId <= 450
        ? generateV1Attributes(billData)
        : generateAttributes(billData);

    const newBillMetadata: BillsMetadata = {
      name: `Treasury Bill #${billData.billNftId}`,
      description: `Treasury Bill #${billData.billNftId}`,
      attributes,
      data: billData,
      tokenId: billData.billNftId,
      contractAddress: this.billNftContractAddress,
    };
    newBillMetadata.image = await this.image.createAndUploadBillImage(
      newBillMetadata,
    );
    return this.billMetadataModel.create(newBillMetadata);
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
    const { terms, payoutToken, principalToken } = await this.getBillTerms(
      billAddress,
    );
    const billContract = this.web3.getContract(
      Network.bsc,
      CUSTOM_BILL_ABI,
      billAddress,
    );
    const billInfo = await billContract.methods.billInfo(tokenId).call();

    const lpData = await getLpInfo(
      principalToken,
      payoutToken,
      this.config.get<string>(`56.apePriceGetter`),
    );
    const bananaAddress = this.config.get<string>(`56.contracts.banana`);

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
      vestingPeriodSeconds: parseInt(terms.vestingTerm),
      payoutToken: payoutToken,
      principalToken: principalToken,
      type:
        payoutToken.toLowerCase() === bananaAddress.toLowerCase()
          ? 'Banana'
          : 'Jungle',
      pairName: createLpPairName(lpData.token0.symbol, lpData.token1.symbol),
      payoutTokenData: lpData.payoutToken,
      token0: lpData.token0,
      token1: lpData.token1,
    };
    return billData;
  }

  async getBillSummary(): Promise<BillSummaryDto[]> {
    let pendingBillMetadata = await this.billMetadataModel
      .find({ 'data.bananaPrice': { $exists: false } })
      .sort({ tokenId: 1 });
    if (pendingBillMetadata.length > 0) {
      this.logger.log('Update latest records');
      await this.loadingBananaPriceAndUpdateBill();
    }
    let billMetadata = await this.billMetadataModel.find().sort({ tokenId: 1 });
    const billSummary: BillSummaryDto[] = billMetadata.map((bill) => ({
      billNftId: bill.data.billNftId,
      bananaPrice: bill.data.bananaPrice,
      createdAddressOwner: bill.data.createdAddressOwner,
      createdAt: bill.data.createdAt,
      lp: `${bill.data.token0.symbol}-${bill.data.token1.symbol}`,
      payoutToken: bill.data.payoutTokenData.symbol,
      vestingTime: bill.data.vestingPeriodSeconds / 60 / 60 / 24,
      payout: bill.data.payout,
      deposit: bill.data.deposit,
      dollarValue: bill.data.dollarValue,
    }));

    return billSummary;
  }

  async loadingBananaPriceAndUpdateBill() {
    let isFinishedUpdate = false;
    let totalPerBash = 50;
    while (!isFinishedUpdate) {
      let billMetadata = await this.billMetadataModel
        .find({ 'data.bananaPrice': { $exists: false } })
        .sort({ tokenId: 1 })
        .limit(totalPerBash);
      if (billMetadata.length > 0) {
        this.logger.log(`Total bills record ${billMetadata.length}`);
        const txHashList = billMetadata.map(
          (bill) => bill.data.createTransactionHash,
        );
        let allFound = false;
        let skip = 0;
        let skipCount = 80;
        let fetchedTransactions = [];
        while (!allFound) {
          let end = txHashList.length;
          if (skip + skipCount < txHashList.length) {
            end = skip + skipCount;
          }
          const sliced = txHashList.slice(skip, end);
          if(sliced.length == 0) {
            allFound = true;
            break;
          }
          const result = await this.bitqueryService.getTransactionInfoByHash(
            sliced,
          );
          if(result.length == 0) {
            allFound = true;
            break;
          }
          fetchedTransactions = [...fetchedTransactions, ...result];
          if (
            Object.keys(result).length < skipCount ||
            skip + skipCount > txHashList.length
          ) {
            allFound = true;
          } else {
            skip += skipCount;
          }
        }
        this.logger.log(
          `Finish get Transactions ${fetchedTransactions.length}`,
        );
        allFound = false;
        skip = 0;
        skipCount = 7; //Not greater than 7 because the query would be very large and it sends a bitquery error
        let fetchedPrices;
        this.logger.log(
          `Get prices from ${fetchedTransactions.length / skipCount} batches`,
        );
        while (!allFound) {
          let end = fetchedTransactions.length;
          if (skip + skipCount < fetchedTransactions.length) {
            end = skip + skipCount;
          }
          const sliced = fetchedTransactions.slice(skip, end);
          if(sliced.length == 0) {
            allFound = true;
            break;
          }
          const result = await this.bitqueryService.getPriceByBlock(sliced);
          fetchedPrices = {
            ...fetchedPrices,
            ...result,
          };
          if (
            Object.keys(result).length < skipCount ||
            skip + skipCount > fetchedTransactions.length
          ) {
            allFound = true;
          } else {
            skip += skipCount;
          }
        }
        this.logger.log(`Finish get prices`);
        const priceKeys = Object.keys(fetchedPrices);
        const f = fetchedTransactions.map(({ block: { height: h } }) => {
          const c = priceKeys.filter((d) => d.includes('' + h));
          const v = {
            block: h,
            data: [],
          };
          c.map((x) => {
            v.data.push(fetchedPrices[x]);
          });
          return v;
        });
        billMetadata.map(async (bill, index) => {
          const bnbPrice =
            f[index].data[3].length > 0 ? f[index].data[3][0].quotePrice : 1;
          const bananaPriceDuring =
            f[index].data[0].length > 0
              ? f[index].data[0][0].price * bnbPrice
              : 0;
          const bananaPriceBefore =
            f[index].data[1].length > 0
              ? f[index].data[1][0].price * bnbPrice
              : 0;
          const bananaPriceAfter =
            f[index].data[2].length > 0
              ? f[index].data[2][0].price * bnbPrice
              : 0;
          const price =
            bananaPriceBefore > 0
              ? bananaPriceBefore
              : bananaPriceDuring > 0
              ? bananaPriceDuring
              : bananaPriceAfter > 0
              ? bananaPriceAfter
              : 0;
          await bill.updateOne({
            $set: {
              'data.bananaPrice': price,
              'data.createdAddressOwner':
                fetchedTransactions[index].sender.address,
              'data.createdAt': fetchedTransactions[index].block.timestamp.time,
            },
          });
        });
        this.logger.log(`Finish mapping`);
      } else {
        isFinishedUpdate = true;
      }
    }
    this.logger.log(`Finished updated`);
  }
}

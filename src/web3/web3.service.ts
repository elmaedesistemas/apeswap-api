import { Injectable } from '@nestjs/common';
import Web3 from 'web3';
import { ethers } from 'ethers';
import { ERC20ABI } from './abi/erc20-abi';
import { ConfigService } from '@nestjs/config';
import { Network } from './network.enum';

@Injectable()
export class Web3Service {
  readonly MAX_UINT =
    '115792089237316195423570985008687907853269984665640564039457584007913129639935';
  private clients = {
    http: new Map<string, unknown>(),
    rpc: new Map<string, unknown>(),
  };

  private archive = new Map<string, unknown>();

  constructor(private config: ConfigService) {}

  getHttpClient(network: Network) {
    if (!this.clients.http[network]) {
      this.clients.http[network] = this.createHttpClient(network);
    }
    return this.clients.http[network];
  }

  getRpcClient(network: Network) {
    if (!this.clients.rpc[network]) {
      this.clients.rpc[network] = this.createRpcClient(network);
    }
    return this.clients.rpc[network];
  }

  getArchiveRpcClient(network: Network) {
    if (!this.archive[network]) {
      this.archive[network] = this.createArchiveRpcClient(network);
    }
    return this.archive[network];
  }

  getBalance(network: Network, address: string): Promise<string> {
    return this.getHttpClient(network).eth.getBalance(address);
  }

  getContract(network: Network, abi: any, address: string): any {
    return new (this.getHttpClient(network).eth.Contract)(abi, address);
  }

  getEthersContract(network: Network, abi: any, address: string): any {
    const contract = new ethers.Contract(
      address,
      abi,
      this.getRpcClient(network),
    );

    return contract;
  }

  getWallet(network: Network, privateKey: string): any {
    const wallet =
      this.getHttpClient(network).eth.accounts.privateKeyToAccount(privateKey);
    return wallet;
  }

  async approveSpend(
    network: Network,
    wallet,
    token: string,
    approved: string,
    amount = this.MAX_UINT,
  ) {
    const contract = this.getContract(network, ERC20ABI, token);
    const transaction = contract.methods.approve(approved, amount);
    const encodedABI = transaction.encodeABI();
    const tx = {
      from: wallet.address,
      to: token,
      gas: 200000,
      data: encodedABI,
    };
    const signedTx = await wallet.signTransaction(tx);
    return this.getHttpClient(network).eth.sendSignedTransaction(
      signedTx.rawTransaction,
    );
  }

  getTransaction(network: Network, transactionHash: string): any {
    return this.getHttpClient(network).eth.getTransactionReceipt(
      transactionHash,
    );
  }

  protected createHttpClient(network: Network) {
    return new Web3(
      new Web3.providers.HttpProvider(this.getRandomNode(network), {
        timeout: 10000,
      }),
    );
  }

  protected createRpcClient(network: Network) {
    return new ethers.providers.JsonRpcProvider(this.getRandomNode(network));
  }

  protected createArchiveRpcClient(network: Network) {
    const archiveNode = this.config.get<string>(`${network}.archiveNode`);
    return new ethers.providers.JsonRpcProvider({
      url: archiveNode,
    });
  }

  protected getRandomNode(network: Network) {
    const appNodes = this.config.get<string[]>(`${network}.appNodes`);
    return appNodes[Math.floor(Math.random() * appNodes.length)];
  }
}

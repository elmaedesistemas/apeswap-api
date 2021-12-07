import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { getWeb3 } from 'src/utils/lib/web3';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CloudinaryService } from '../services/cloudinary/cloudinary.service';
import { Iazo } from './dto/iazo.dto';
import { Iazo as IazoSchema, IazoDocument } from './schema/iazo.schema';
import { MailgunService } from 'src/services/mailgun/mailgun.service';
import { getContract } from 'src/utils/lib/web3';
import iazoABI from './utils/iazo.json';
import { ChainConfigService } from 'src/config/chain.configuration.service';
@Injectable()
export class IazoService {
  maxUploadSizeMb = process.env.MAX_UPLOAD_SIZE || 1;
  constructor(
    @InjectModel(IazoSchema.name)
    private iazoModel: Model<IazoDocument>,
    @Inject(CloudinaryService)
    private readonly _cloudinaryService: CloudinaryService,
    private mailgunService: MailgunService,
    private configService: ChainConfigService,
  ) {}
  iazoExposerAddress = this.configService.get<string>(`iazoExposer`);
  web3 = getWeb3();
  dataValidate = [];

  async searchIaoz(filter = {}) {
    return this.iazoModel.find(filter);
  }

  async createIazo(iazoDto: Iazo, file: Express.Multer.File) {
    await this.validateAddressIazo(iazoDto.iazoAddress);
    const uniqueIazo = await this.searchIaoz({
      iazoAddress: iazoDto.iazoAddress,
    });
    if (uniqueIazo.length > 0)
      throw new HttpException('Iazo already exists', HttpStatus.BAD_REQUEST);
    let uploadFile = {
      url: '',
    };
    const fileSize = file.size / 1024 / 1024; // in MiB
    if (fileSize > this.maxUploadSizeMb)
      throw new BadRequestException('Image larger than 1MB');
    try {
      uploadFile = await this._cloudinaryService.uploadBuffer(file.buffer);
    } catch (error) {
      console.log('Upload image', error);
    }
    iazoDto.status = 'Pending';
    iazoDto.pathImage = uploadFile?.url;
    const { startBlockTime, endBlockTime } = await this.calculateBlock(
      iazoDto.startDate,
      iazoDto.endDate,
    );
    iazoDto.startBlock = startBlockTime;
    iazoDto.endBlock = endBlockTime;
    // notification Discord
    this.mailgunService.notifyByEmail('New IAZO', 'iazo', iazoDto);
    return this.iazoModel.create(iazoDto);
  }

  async fetchIaozs() {
    return await this.searchIaoz();
  }

  async getIaozUser(ownerAddress) {
    return await this.searchIaoz({ owner: ownerAddress });
  }

  async getIazoByAddress(address) {
    return this.searchIaoz({ iazoAddress: address });
  }

  async detailIaoz(iazoId) {
    return await this.iazoModel.findById(iazoId);
  }

  async fetchIazoStaff() {
    return this.iazoModel.find();
  }

  async approveIazo(_id, approveIazoDto) {
    const subject =
      approveIazoDto.status === 'Rejected' ? 'Rejected IAZO' : 'Approved IAZO';
    const data = {
      approved: approveIazoDto.status === 'Approved',
      rejected: approveIazoDto.status === 'Rejected',
      comments: approveIazoDto.comments,
    };
    this.mailgunService.notifyByEmail(subject, 'iazo_approve', data);
    return await this.iazoModel.updateOne({ _id }, approveIazoDto);
  }

  async addTagIazo(_id, tags) {
    const iazo = await this.detailIaoz(_id)
    const data = [...iazo.tags, tags]
    return await this.iazoModel.updateOne({ _id }, { tags: data });
  }
  
  async updateTagIazo(_id, tags, position) {
    const iazo = await this.detailIaoz(_id)
    iazo.tags[position] = tags
    const data = [...iazo.tags]
    return await this.iazoModel.updateOne({ _id }, { tags: data });
  }
  
  async removeTagIazo(_id, position) {
    const iazo = await this.detailIaoz(_id)
    iazo.tags.splice(position, 1)
    return await this.iazoModel.updateOne({ _id }, { tags:  iazo.tags });
  }

  async calculateBlock(startTimestamp, endTimestamp) {
    const block = await this.web3.eth.getBlockNumber();
    const blockTimestamp = await (await this.web3.eth.getBlock(block))
      .timestamp;

    const startBlockTime =
      Math.round((startTimestamp - Number(blockTimestamp)) / 3) + 20 + block;
    const endBlockTime =
      Math.round((endTimestamp - Number(blockTimestamp)) / 3) + 20 + block;

    return { startBlockTime, endBlockTime };
  }

  async validateAddressIazo(address) {
    const iazoContract = getContract(iazoABI, this.iazoExposerAddress);
    const isRegistered = await iazoContract.methods
      .IAZOIsRegistered(address)
      .call();
    if (!isRegistered)
      throw new HttpException('Invalid Iazo Address', HttpStatus.BAD_REQUEST);
  }
}
import { HttpService, Injectable, Logger } from '@nestjs/common';
import {
  UltimateTextToImage,
  getCanvasImage,
  registerFont,
  IImage,
} from 'ultimate-text-to-image';
import path from 'path';
import svg2img from 'svg2img';
import { writeFile, readFile } from 'fs/promises';
import moment from 'moment';
import { BillMetadata } from './interface/billData.interface';
import { pinFileToIPFS } from './pinata.helper';
import sleep from 'sleep-promise';

@Injectable()
export class BillsImagesService {
  logger = new Logger(BillsImagesService.name);

  constructor(private httpService: HttpService) {
    registerFont(path.join(__dirname, './fonts/Cash-Currency.ttf'), {
      family: 'cashFont',
    });
    registerFont(path.join(__dirname, './fonts/ChevalierOpeDCD.otf'), {
      family: 'Chevalier',
    });
  }

  toSvg(url: string, width: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      svg2img(url, { width, height: width }, async function (error, buffer) {
        if (error) return reject(error);
        await writeFile(path.join(__dirname, 'test.png'), buffer);
        return resolve(buffer);
      });
    });
  }

  async createAndUploadBillImage(billMetadata: BillMetadata, attempt = 0) {
    try {
      this.logger.log(`Generating bill ${billMetadata.name}`);
      const buffer = await this.createBillImageWithMetadata(billMetadata);
      const pin = await pinFileToIPFS(
        process.env.PINATA_KEY,
        process.env.PINATA_SECRET,
        billMetadata.name,
        buffer,
      );
      return `https://ipfs.io/ipfs/${pin.data.IpfsHash}`;
    } catch (e) {
      this.logger.error(
        'Something went wrong creating and uploading the image',
      );
      this.logger.error(e);
      if (attempt < 5) {
        this.logger.log(`Retrying: ${attempt}`);
        await sleep(100 * attempt);
        return this.createAndUploadBillImage(billMetadata, attempt + 1);
      }
      throw e;
    }
  }

  async createBillImageWithMetadata(billMetadata: BillMetadata) {
    // TODO: new image
    let billBorder = 'silver';
    if (
      billMetadata.data.dollarValue >= 100 &&
      billMetadata.data.dollarValue < 1000
    ) {
      billBorder = 'silver';
    } else if (
      billMetadata.data.dollarValue >= 1000 &&
      billMetadata.data.dollarValue < 10000
    ) {
      billBorder = 'gold';
    } else if (billMetadata.data.dollarValue >= 10000) {
      billBorder = 'diamond';
    }

    const baseLayers = [
      './v1/location.png',
      './v1/innovation.png',
      `./v1/legend-${billBorder}.png`,
      './v1/moment.png',
      './v1/rectangles.png',
      './v1/stamp.png',
      './v1/trend.png',
      './v1/BANANA.png',
      './v1/WBNB.png',
      // TODO: Get all token images
      //`./v1/${billMetadata.data.token0.symbol}.png`,
      // `./v1/${billMetadata.data.token1.symbol}.png`,
    ];

    const layers = await this.createLayers(baseLayers);

    const type = await this.textToCanvasImage(
      `${billMetadata.data.type.toUpperCase()} BILL`,
      30,
      'cashFont',
      '#8D8578',
    );

    const vesting = await this.textToCanvasImage(
      `${billMetadata.data.vestingPeriodSeconds / 86400} DAYS`,
      30,
      'cashFont',
      '#8D8578',
    );

    const totalPayout = await this.textToCanvasImage(
      `TOTAL PAYOUT`,
      18,
      'cashFont',
    );

    let precision = 5;
    if (billMetadata.data.payout >= 100000) precision = 0;
    else if (billMetadata.data.payout >= 10000) precision = 1;
    else if (billMetadata.data.payout >= 1000) precision = 2;
    else if (billMetadata.data.payout >= 100) precision = 3;
    else if (billMetadata.data.payout >= 10) precision = 4;

    const amount = await this.textToCanvasImage(
      `${billMetadata.data.payout.toFixed(precision)} ${
        billMetadata.data.payoutTokenData.symbol
      }`,
      26,
      'cashFont',
    );

    const maturation = await this.textToCanvasImage(
      moment(billMetadata.data.expires * 1000)
        .format('Do of MMMM, YYYY')
        .toString()
        .toUpperCase(),
      18,
      'cashFont',
    );

    const canvas = await getCanvasImage({ buffer: layers });

    const textToImage = new UltimateTextToImage('', {
      width: 1920,
      height: 1080,
      images: [
        { canvasImage: canvas, layer: -1, repeat: 'fit' },
        {
          canvasImage: type,
          layer: 1,
          x: 1440,
          y: 325,
        },
        {
          canvasImage: vesting,
          layer: 1,
          x: 1510,
          y: 370,
        },
        {
          canvasImage: totalPayout,
          layer: 1,
          x: 1500,
          y: 855,
        },
        {
          canvasImage: amount,
          layer: 1,
          x: 1460,
          y: 882,
        },
        {
          canvasImage: maturation,
          layer: 1,
          x: 1475,
          y: 920,
        },
      ],
    })
      .render()
      .toStream();
    return textToImage;
  }

  async createLayers(layers) {
    const layerBuffers = await Promise.all(
      layers.map((layer) => {
        return readFile(path.join(__dirname, `./images/${layer}`));
      }),
    );

    const imageCanvas = await Promise.all(
      layerBuffers.map((buffer: Buffer) => {
        return getCanvasImage({ buffer });
      }),
    );

    const images: IImage[] = imageCanvas.map((canvasImage) => {
      return { canvasImage, layer: 0, repeat: 'fit' };
    });

    const textToImage = new UltimateTextToImage('', {
      width: 1920,
      height: 1080,
      images,
    })
      .render()
      .toBuffer();
    return textToImage;
  }

  textToCanvasImage(
    text: string,
    fontSize: number,
    fontFamily = 'sans-serif',
    fontColor = '#7E7579',
  ) {
    const buffer = new UltimateTextToImage(text, {
      fontSize,
      fontFamily,
      fontColor,
    })
      .render()
      .toBuffer();
    return getCanvasImage({ buffer });
  }
}

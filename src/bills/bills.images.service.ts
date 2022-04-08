import { HttpService, Injectable } from '@nestjs/common';
import { UltimateTextToImage, getCanvasImage } from 'ultimate-text-to-image';
import path from 'path';
import svg2img from 'svg2img';
import { writeFile } from 'fs/promises';
import { keyBy } from 'lodash';

// - Committed token (what the buyer gives, section A above)
// - Received token (what the buyer gets vested, section A above)
// - Terms Section (Amount of received TOKEN over the vested period)
// - Vesting period (x days)
// - Type (Jungle or BANANA)
// - Maturation Date
// - Easter Egg (for season)

@Injectable()
export class BillsImagesService {
  tokenListUrl =
    'https://raw.githubusercontent.com/ApeSwapFinance/apeswap-token-lists/main/lists/apeswap.json';

  tokenList;

  constructor(private httpService: HttpService) {}

  toSvg(url: string, width: number): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      svg2img(url, { width, height: width }, async function (error, buffer) {
        if (error) return reject(error);
        await writeFile(path.join(__dirname, 'test.png'), buffer);
        return resolve(buffer);
      });
    });
  }

  async createBillImage(config) {
    const token1 = await this.getToken(config.tokenAddress1);
    const token2 = await this.getToken(config.tokenAddress2);
    const payoutToken = await this.getToken(config.payoutTokenAddress);
    const tokenImage1Uri = token1.logoURI;
    const tokenImage2Uri = token2.logoURI;

    let canvasImage1;
    let canvasImage2;
    if (tokenImage1Uri.includes('.svg')) {
      const buffer = await this.toSvg(tokenImage1Uri, 400);
      canvasImage1 = await getCanvasImage({ buffer });
    } else canvasImage1 = await getCanvasImage({ url: tokenImage1Uri });

    if (tokenImage2Uri.includes('.svg')) {
      const buffer = await this.toSvg(tokenImage2Uri, 400);
      canvasImage2 = await getCanvasImage({ buffer });
    } else canvasImage2 = await getCanvasImage({ url: tokenImage2Uri });

    const background = await getCanvasImage({ url: config.background });
    const amount = await this.textToCanvasImage(
      `1,000 ${payoutToken.symbol} over ${config.vesting} days`,
      18,
    );

    const type = await this.textToCanvasImage(`${config.type} Bill`, 18);
    const maturation = await this.textToCanvasImage(
      config.maturationDate.toDateString(),
      18,
    );

    const textToImage = new UltimateTextToImage(
      `${token1.symbol}-${token2.symbol} APE-LP`,
      {
        width: 850,
        height: 600,
        align: 'center',
        marginTop: 200,
        fontSize: 42,
        images: [
          { canvasImage: background, layer: -1, repeat: 'fit' },
          {
            canvasImage: canvasImage1,
            layer: 0,
            repeat: 'fit',
            width: 120,
            height: 120,
            x: 670,
            y: 60,
          },
          {
            canvasImage: canvasImage2,
            layer: 0,
            repeat: 'fit',
            x: 60,
            y: 60,
            width: 120,
            height: 120,
          },
          {
            canvasImage: amount,
            layer: 1,
            x: 425 - amount.width / 2,
            y: 310,
          },
          {
            canvasImage: type,
            layer: 1,
            x: 605,
            y: 490,
          },
          {
            canvasImage: maturation,
            layer: 1,
            x: 170,
            y: 490,
          },
        ],
      },
    )
      .render()
      .toFile(path.join(__dirname, `image-${Math.random()}.png`));
    return textToImage;
  }

  textToCanvasImage(text: string, fontSize: number) {
    const buffer = new UltimateTextToImage(text, { fontSize })
      .render()
      .toBuffer();
    return getCanvasImage({ buffer });
  }

  async getToken(tokenAddress: string) {
    const tokenList = await this.getTokenList();
    return tokenList[tokenAddress.toLowerCase()];
  }

  async getTokenList() {
    if (!this.tokenList) this.tokenList = await this.fetchTokenList();
    return this.tokenList;
  }

  async fetchTokenList() {
    const { data } = await this.httpService.get(this.tokenListUrl).toPromise();
    const tokens = data.tokens.map((token) => {
      return { ...token, address: token.address.toLowerCase() };
    });
    return keyBy(tokens, 'address');
  }
}

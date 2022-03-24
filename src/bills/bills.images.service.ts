import { Injectable } from '@nestjs/common';
import { UltimateTextToImage, getCanvasImage } from 'ultimate-text-to-image';
import path from 'path';

@Injectable()
export class BillsImagesService {
  async createBillImage(config) {
    const background = await getCanvasImage({ url: config.background });
    const canvasImage1 = await getCanvasImage({ url: config.token1Url });
    const canvasImage2 = await getCanvasImage({ url: config.token2Url });
    const buffer = new UltimateTextToImage('1,000 BANANA', { fontSize: 18 })
      .render()
      .toBuffer();
    const canvasImage3 = await getCanvasImage({ buffer });

    const textToImage = new UltimateTextToImage('BANANA-BNB', {
      width: 850,
      height: 600,
      align: 'center',
      marginTop: 200,
      fontSize: 52,
      images: [
        { canvasImage: background, layer: -1, repeat: 'fit' },
        {
          canvasImage: canvasImage1,
          layer: 0,
          repeat: 'fit',
          width: 200,
          height: 200,
          x: 640,
          y: 10,
        },
        {
          canvasImage: canvasImage2,
          layer: 0,
          repeat: 'fit',
          x: 10,
          y: 10,
          width: 200,
          height: 200,
        },
        {
          canvasImage: canvasImage3,
          layer: 1,
          // repeat: 'fit',
          x: 350,
          y: 310,
        },
      ],
    })
      .render()
      .toFile(path.join(__dirname, 'image3.png'));
    return textToImage;
  }
}

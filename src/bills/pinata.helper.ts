//imports needed for this function
import axios from 'axios';
import FormData from 'form-data';
import { Readable } from 'stream';

export const pinFileToIPFS = (
  pinataApiKey: string,
  pinataSecretApiKey: string,
  name: string,
  streamData: Readable,
) => {
  const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
  const data = new FormData();

  // PINATA API Related workaround
  (streamData as any).path = 'some_filename.png';
  data.append('file', streamData);

  const metadata = JSON.stringify({
    name,
    keyvalues: {
      exampleKey: 'exampleValue',
    },
  });
  data.append('pinataMetadata', metadata);

  return axios.post(url, data, {
    maxBodyLength: 999999999999999999999, // this is needed to prevent axios from erroring out with large files
    headers: {
      'Content-Type': `multipart/form-data; boundary=${
        (data as any)._boundary
      }`,
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
  });
};

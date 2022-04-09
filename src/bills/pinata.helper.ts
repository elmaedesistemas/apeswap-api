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

  //You'll need to make sure that the metadata is in the form of a JSON object that's been convered to a string
  //metadata is optional
  const metadata = JSON.stringify({
    name,
    keyvalues: {
      exampleKey: 'exampleValue',
    },
  });
  data.append('pinataMetadata', metadata);

  const pinataOptions = JSON.stringify({
    cidVersion: 0,
    customPinPolicy: {
      regions: [
        {
          id: 'FRA1',
          desiredReplicationCount: 1,
        },
        {
          id: 'NYC1',
          desiredReplicationCount: 2,
        },
      ],
    },
  });
  // data.append('pinataOptions', pinataOptions);

  return axios.post(url, data, {
    maxBodyLength: 999999999999999999999, //this is needed to prevent axios from erroring out with large files
    headers: {
      'Content-Type': `multipart/form-data; boundary=${
        (data as any)._boundary
      }`,
      pinata_api_key: pinataApiKey,
      pinata_secret_api_key: pinataSecretApiKey,
    },
  });
};

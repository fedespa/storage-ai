import { registerAs } from '@nestjs/config';

import * as dotenv from 'dotenv';

dotenv.config({ override: true });

export interface AwsConfig {
  region: string;
  bucket: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export default registerAs(
  'aws',
  (): AwsConfig => ({
    region: process.env.AWS_REGION || 'us-east-2',
    bucket: process.env.AWS_BUCKET || '',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY || '',
      secretAccessKey: process.env.AWS_SECRET_KEY || '',
    },
  }),
);

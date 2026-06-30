import { registerAs } from '@nestjs/config';
import { join } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ override: true });

export default registerAs('database', () => ({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, '../migrations/*{.ts,.js}')],
  synchronize: true, //process.env.NODE_ENV !== 'production'
  logging: false, //process.env.NODE_ENV === 'development',
}));

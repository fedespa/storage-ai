import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import databaseConfig from 'src/config/database.config';

dotenv.config({ override: true });

export const dataSourceOptions = databaseConfig() as DataSourceOptions;

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;

import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const databaseConfig = (): TypeOrmModuleOptions => {
  const baseConfig: TypeOrmModuleOptions = {
    type: 'postgres',
    autoLoadEntities: true,
    synchronize: process.env.APP_ENV === 'development',
    logging: process.env.APP_ENV === 'development',
  };

  if (process.env.DATABASE_URL) {
    return {
      ...baseConfig,
      url: process.env.DATABASE_URL,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };
  }

  return {
    ...baseConfig,
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'clinic_user',
    password: process.env.DB_PASSWORD || 'clinic_password',
    database: process.env.DB_NAME || 'clinic_db',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  };
};

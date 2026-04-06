import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import { redisConfig } from '../../config/redis.config';
import { RedisCacheService } from './cache.service';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      useFactory: async () => {
        const config = redisConfig();
        return {
          store: redisStore,
          host: config.host,
          port: config.port,
          ttl: 300, // 5 min default TTL
        };
      },
    }),
  ],
  providers: [RedisCacheService],
  exports: [NestCacheModule, RedisCacheService],
})
export class AppCacheModule {}

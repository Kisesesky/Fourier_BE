// src/config/index.ts

// App
export { default as appConfig } from './app/configuration';
export { appEnvSchema } from './app/env.schema';

// DB
export { default as dbConfig } from './db/configuration';
export { dbEnvSchema } from './db/env.schema';

// Redis
export { default as redisConfig } from './redis/configuration';
export { redisEnvSchema } from './redis/env.schema';

// GCS
export { default as gcsConfig } from './gcs/configuration';
export { gcsEnvSchema } from './gcs/env.schema';

// Social
export { default as socialConfig } from './social/configuration';
export { socialEnvSchema } from './social/env.schema';
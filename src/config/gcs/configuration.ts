//src/config/gcs/configuration.ts
import { registerAs } from '@nestjs/config';

export default registerAs('gcs', () => ({
  gcsKeyFile: process.env.GCS_STORAGE_KEYFILE,
  gcsSecretName: process.env.GCS_SECRET_NAME,
  gcsBucketName: process.env.GCS_STORAGE_BUCKET,
  gcsProjectId: process.env.GCS_STORAGE_PROJECT_ID,
}));
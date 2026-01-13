// src/modules/docs/decorators/require-doc-permission.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { DocPermission } from '../constants/doc-permission.enum';

export const REQUIRE_DOC_PERMISSION_KEY = 'doc_permission';

export const RequireDocPermission = (permission: DocPermission) =>
  SetMetadata(REQUIRE_DOC_PERMISSION_KEY, permission);
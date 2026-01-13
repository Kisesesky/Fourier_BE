// src/modules/docs/guards/doc-permission.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { DocPermission } from "../constants/doc-permission.enum";
import { DocPermissionService } from "../services/doc-permission.service";
import { REQUIRE_DOC_PERMISSION_KEY } from "../decorators/require-doc-permission.decorator";

@Injectable()
export class DocPermissionGuard implements CanActivate {
  constructor(private readonly permissionService: DocPermissionService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    const document = req.document;
    const folder = req.folder;
    const required = Reflect.getMetadata(
      REQUIRE_DOC_PERMISSION_KEY,
      ctx.getHandler(),
    );

    if (!required) return true;

    const permission = await this.permissionService.getUserPermission(
      user.id,
      document,
      folder,
    );

    if (!permission) throw new ForbiddenException();

    const rank = [DocPermission.READ, DocPermission.WRITE, DocPermission.ADMIN];
    if (rank.indexOf(permission) < rank.indexOf(required)) {
      throw new ForbiddenException();
    }

    return true;
  }
}
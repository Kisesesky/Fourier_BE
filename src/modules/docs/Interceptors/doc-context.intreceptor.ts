// docs/interceptors/doc-context.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Folder } from "../entities/folder.entity";
import { Document } from '../entities/document.entity';

@Injectable()
export class DocContextInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(Document)
    private readonly docRepo: Repository<Document>,
    @InjectRepository(Folder)
    private readonly folderRepo: Repository<Folder>,
  ) {}

  async intercept(ctx: ExecutionContext, next: CallHandler) {
    const req = ctx.switchToHttp().getRequest();

    if (req.params.id) {
      req.document = await this.docRepo.findOne({
        where: { id: req.params.id },
        relations: ['folder'],
      });
    }

    if (req.body.folderId) {
      req.folder = await this.folderRepo.findOne({
        where: { id: req.body.folderId },
        relations: ['parent'],
      });
    }

    return next.handle();
  }
}
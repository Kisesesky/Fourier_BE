// src/common/decorators/request.origin.ts
import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Request } from "express";

export const RequestOrigin = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return (
      request.headers.origin ??
      `${request.protocol}://${request.get('host')}`
    );
  },
);
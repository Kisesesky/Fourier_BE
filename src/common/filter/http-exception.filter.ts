import { ExceptionFilter, ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { Request, Response } from "express";

// @Catch 데코레이터는 이 필터가 'HttpException' 타입의 에러만 잡음
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp(); // 1. 실행 컨텍스트에서 HTTP 관련 객체를 가져온다.
    const response = ctx.getResponse<Response>(); // 2. Express의 Response 객체
    const request = ctx.getRequest<Request>(); // 3. Express의 Request 객체
    const status = exception.getStatus(); // 4. 예외가 발생한 상태 코드 (예: 400, 404)

    // exception에서 message부분을 추출
    // (string)일 수도 있고 object일 수도 있어 분기 처리)
    const errorResponse = exception.getResponse();
    const message = typeof errorResponse === 'object'
      ? errorResponse['message'] : errorResponse;

    // 5. 응답형태를 JSON형태로 재조립
    response.status(status).json({
        success: false,
        timestamp: new Date().toISOString(),
        path: request.url,
        statusCode: status,
        message: message,
      })
  }
}
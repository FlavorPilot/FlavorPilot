import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
  type ExceptionFilter
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

interface ErrorPayload {
  code?: string;
  message?: string | string[];
  details?: unknown;
}

interface HttpLikeError {
  statusCode?: number;
  code?: string;
  message?: string;
}

const isHttpStatus = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 400 && value <= 599;

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const response = http.getResponse<FastifyReply>();
    const request = http.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let payload: ErrorPayload = {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected error occurred"
    };

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      payload = typeof body === "string" ? { message: body } : (body as ErrorPayload);
    } else if (typeof exception === "object" && exception !== null) {
      const httpError = exception as HttpLikeError;
      if (!isHttpStatus(httpError.statusCode)) {
        this.logger.error(exception instanceof Error ? exception.stack : String(exception));
        response.status(status).send({
          statusCode: status,
          code: payload.code,
          message: payload.message,
          requestId: request.id,
          timestamp: new Date().toISOString(),
          path: request.url
        });
        return;
      }
      status = httpError.statusCode;
      payload = {
        code: httpError.code ?? `HTTP_${status}`,
        message: status < 500 ? httpError.message ?? "Request failed" : "An unexpected error occurred"
      };
      if (status >= 500) {
        this.logger.error(exception instanceof Error ? exception.stack : String(exception));
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack ?? exception.message : String(exception)
      );
    }

    response.status(status).send({
      statusCode: status,
      code: payload.code ?? `HTTP_${status}`,
      message: Array.isArray(payload.message)
        ? payload.message.join(", ")
        : payload.message ?? "Request failed",
      ...(payload.details === undefined ? {} : { details: payload.details }),
      requestId: request.id,
      timestamp: new Date().toISOString(),
      path: request.url
    });
  }
}

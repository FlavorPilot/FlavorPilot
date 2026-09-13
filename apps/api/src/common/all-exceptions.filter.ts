import { ArgumentsHost, Catch, HttpException, Logger, type ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);
    catch(error: unknown, host: ArgumentsHost) {
        const http = host.switchToHttp(), reply = http.getResponse<FastifyReply>(), request = http.getRequest<FastifyRequest>();
        const status = error instanceof HttpException ? error.getStatus() : 500;
        const response = error instanceof HttpException ? error.getResponse() : null;
        const payload = typeof response === 'object' && response !== null ? response as Record<string, unknown> : {};
        // Do not log recipes, tokens, connection strings, SQL parameters or URL query strings.
        if (status >= 500)
            this.logger.error(`request=${request.id} status=${status} type=${error instanceof Error ? error.name : 'UnknownError'}`);
        reply.code(status).header('Cache-Control', 'no-store').send({ statusCode: status, code: typeof payload.code === 'string' ? payload.code : status === 500 ? 'INTERNAL_ERROR' : `HTTP_${status}`, message: typeof payload.message === 'string' ? payload.message : status === 500 ? 'Unexpected server error' : typeof response === 'string' ? response : 'Request failed', ...(status < 500 && payload.details ? { details: payload.details } : {}), requestId: request.id, timestamp: new Date().toISOString() });
    }
}

import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const { method, url } = req;
    const started = Date.now();

    return next.handle().pipe(
      tap((body) => {
        const ms = Date.now() - started;
        const tokens =
          body &&
          typeof body === 'object' &&
          'usage' in body &&
          body.usage &&
          typeof body.usage === 'object'
            ? (body.usage as { totalTokens?: number }).totalTokens
            : undefined;
        const extra = tokens ? ` tokens=${tokens}` : '';
        this.logger.log(`${method} ${url} ${ms}ms${extra}`);
      }),
    );
  }
}

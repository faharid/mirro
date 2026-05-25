import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const body = req.body as { userId?: string } | undefined;
    const headers = req.headers as Record<string, string | string[] | undefined>;
    const headerUserId = headers['x-user-id'];
    const userId =
      body?.userId ||
      (typeof headerUserId === 'string' ? headerUserId : headerUserId?.[0]);
    if (userId) return `user:${userId}`;
    return (req.ip as string) || 'anonymous';
  }
}

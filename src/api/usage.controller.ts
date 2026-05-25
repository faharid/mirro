import { Controller, Get, Query } from '@nestjs/common';
import { TokenUsageService } from '../cache/token-usage.service';

@Controller('usage')
export class UsageController {
  constructor(private readonly tokenUsage: TokenUsageService) {}

  @Get()
  getUsage(@Query('userId') userId?: string) {
    return this.tokenUsage.getUsage(userId || 'anonymous');
  }
}

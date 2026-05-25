import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserTokenUsageEntity } from '../database/entities/user-token-usage.entity';
import { ChatResponse } from '../llm/types/response';

@Injectable()
export class TokenUsageService {
  constructor(
    @InjectRepository(UserTokenUsageEntity)
    private readonly usageRepo: Repository<UserTokenUsageEntity>,
  ) {}

  async recordUsage(
    userId: string,
    usage?: ChatResponse['usage'],
    budgetHeader?: string,
  ): Promise<{ totalTokens: number; budget?: number }> {
    const tokens =
      (usage?.totalTokens ?? 0) ||
      (usage?.promptTokens ?? 0) + (usage?.completionTokens ?? 0);

    if (tokens <= 0) {
      const row = await this.usageRepo.findOne({ where: { userId } });
      return {
        totalTokens: Number(row?.totalTokens ?? 0),
        budget: budgetHeader ? Number(budgetHeader) : undefined,
      };
    }

    let row = await this.usageRepo.findOne({ where: { userId } });
    if (!row) {
      row = this.usageRepo.create({ userId, totalTokens: '0' });
    }
    row.totalTokens = String(Number(row.totalTokens) + tokens);
    row.updatedAt = new Date();
    await this.usageRepo.save(row);

    const budget = budgetHeader ? Number(budgetHeader) : undefined;
    const total = Number(row.totalTokens);
    if (budget && !Number.isNaN(budget) && total > budget) {
      throw new BadRequestException(
        `Token budget exceeded (${total}/${budget})`,
      );
    }

    return { totalTokens: total, budget };
  }

  async getUsage(userId: string): Promise<{ totalTokens: number }> {
    const row = await this.usageRepo.findOne({ where: { userId } });
    return { totalTokens: Number(row?.totalTokens ?? 0) };
  }
}

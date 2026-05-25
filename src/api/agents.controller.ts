import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentFactory } from '../agents/agent.factory';
import { AgentConfigEntity } from '../database/entities/agent-config.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@Controller('agents')
export class AgentsController {
  constructor(
    private readonly agentFactory: AgentFactory,
    @InjectRepository(AgentConfigEntity)
    private readonly agentRepo: Repository<AgentConfigEntity>,
  ) {}

  @Get()
  list() {
    const builtIn = this.agentFactory.list();
    return { agents: builtIn };
  }

  @Post()
  async create(@Body() dto: CreateAgentDto) {
    const agent = this.agentRepo.create({
      name: dto.name,
      type: dto.type,
      systemPrompt: dto.systemPrompt,
      tools: dto.tools || [],
      model: dto.model || 'gpt-4o-mini',
      provider: dto.provider || 'openai',
    });
    return this.agentRepo.save(agent);
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    try {
      const builtIn = this.agentFactory.create(id);
      return builtIn.getConfig();
    } catch {
      const custom = await this.agentRepo.findOne({ where: { id } });
      if (!custom) {
        throw new NotFoundException(`Agent not found: ${id}`);
      }
      return custom;
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAgentDto) {
    const agent = await this.agentRepo.findOne({ where: { id } });
    if (!agent) {
      throw new NotFoundException(`Custom agent not found: ${id}`);
    }
    Object.assign(agent, dto);
    return this.agentRepo.save(agent);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const result = await this.agentRepo.delete({ id });
    if (!result.affected) {
      throw new NotFoundException(`Custom agent not found: ${id}`);
    }
    return { deleted: true, id };
  }
}

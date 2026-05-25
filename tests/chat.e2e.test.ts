import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AgentsController } from '../src/api/agents.controller';
import { AgentFactory } from '../src/agents/agent.factory';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AgentConfigEntity } from '../src/database/entities/agent-config.entity';

describe('API E2E', () => {
  let app: INestApplication;

  const mockAgentFactory = {
    list: () => [
      { id: 'assistant', name: 'assistant' },
      { id: 'support', name: 'support' },
      { id: 'domain', name: 'domain' },
    ],
    create: jest.fn(),
  };

  const mockRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AgentsController],
      providers: [
        { provide: AgentFactory, useValue: mockAgentFactory },
        {
          provide: getRepositoryToken(AgentConfigEntity),
          useValue: mockRepo,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/agents should list built-in agents', () => {
    return request(app.getHttpServer())
      .get('/api/agents')
      .expect(200)
      .expect((res) => {
        expect(res.body.agents).toHaveLength(3);
        expect(res.body.agents[0].id).toBe('assistant');
      });
  });
});

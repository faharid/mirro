import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { RagService } from '../rag/rag.service';
import { QueueService } from '../queue/queue.service';
import { KnowledgeIngestDto, KnowledgeSearchDto } from './dto/knowledge.dto';

@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly ragService: RagService,
    private readonly queueService: QueueService,
  ) {}

  @Get('search')
  async search(@Query() query: KnowledgeSearchDto) {
    const results = await this.ragService.retrieve(query.q, {
      topK: query.topK ? Number(query.topK) : 5,
    });
    return { results };
  }

  @Post('ingest')
  async ingest(@Body() dto: KnowledgeIngestDto) {
    const result = await this.ragService.ingestLocal(dto.path);
    return { status: 'completed', ...result };
  }

  @Post('ingest/async')
  async ingestAsync(@Body() dto: KnowledgeIngestDto) {
    const { jobId } = await this.queueService.addAsyncAction({
      type: 'ingest_rag',
      path: dto.path,
    });
    return { jobId, status: 'queued' };
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const uploadDir = join(process.cwd(), 'uploads');
    await mkdir(uploadDir, { recursive: true });
    const filePath = join(uploadDir, file.originalname);
    await writeFile(filePath, file.buffer);

    const documents = await this.ragService.loadDocuments({
      source: 'local',
      path: uploadDir,
    });
    const chunks = this.ragService.chunkDocuments(documents);
    await this.ragService.embedChunks(chunks);

    return { uploaded: file.originalname, chunks: chunks.length };
  }
}

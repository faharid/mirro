import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClonesService } from '../clones/clones.service';
import {
  CreateCloneDto,
  InterviewMessageDto,
  UpdateQuestionnaireDto,
} from './dto/clone.dto';

@Controller('clones')
export class ClonesController {
  constructor(private readonly clonesService: ClonesService) {}

  @Post()
  create(@Body() dto: CreateCloneDto) {
    return this.clonesService.create(
      dto.userId || 'anonymous',
      dto.displayName,
    );
  }

  @Get()
  list(@Query('userId') userId?: string) {
    return this.clonesService.findAll(userId || 'anonymous');
  }

  @Get(':id')
  get(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.clonesService.findOne(id, userId);
  }

  @Patch(':id/questionnaire')
  updateQuestionnaire(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionnaireDto,
  ) {
    return this.clonesService.updateQuestionnaire(
      id,
      dto.userId || 'anonymous',
      dto.answers,
    );
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file'))
  async uploadDocument(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('userId') userId?: string,
  ) {
    const content = file.buffer.toString('utf-8');
    return this.clonesService.uploadDocument(
      id,
      userId || 'anonymous',
      file.originalname,
      content,
    );
  }

  @Post(':id/interview')
  interview(@Param('id') id: string, @Body() dto: InterviewMessageDto) {
    return this.clonesService.interview(
      id,
      dto.userId || 'anonymous',
      dto.message,
    );
  }

  @Post(':id/generate-mirror-card')
  generateMirrorCard(
    @Param('id') id: string,
    @Query('userId') userId?: string,
  ) {
    return this.clonesService.generateMirrorCard(id, userId || 'anonymous');
  }

  @Post(':id/activate')
  activate(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.clonesService.activate(id, userId || 'anonymous');
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.clonesService.remove(id, userId || 'anonymous');
  }
}

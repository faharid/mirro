import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { LlmModule } from '../llm/llm.module';
import { ClonesService } from './clones.service';
import { MirrorCardService } from './mirror-card.service';
import { CloneInterviewService } from './clone-interview.service';
import { CloneDocumentService } from './clone-document.service';

@Module({
  imports: [DatabaseModule, LlmModule],
  providers: [
    ClonesService,
    MirrorCardService,
    CloneInterviewService,
    CloneDocumentService,
  ],
  exports: [ClonesService, MirrorCardService],
})
export class ClonesModule {}

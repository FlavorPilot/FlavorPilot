import { Module } from '@nestjs/common';
import { CommentsController, FeedbackController } from './feedback.controller';
import { FeedbackService } from './feedback.service';
@Module({controllers:[FeedbackController,CommentsController],providers:[FeedbackService]})
export class FeedbackModule {}

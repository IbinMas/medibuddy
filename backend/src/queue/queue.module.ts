import { Global, Module } from '@nestjs/common';
import { ReminderQueueService } from './reminder-queue.service';
import { ReminderProcessor } from './reminder-processor';
import { ReminderCronService } from './reminder.cron';

@Global()
@Module({
  providers: [ReminderQueueService, ReminderProcessor, ReminderCronService],
  exports: [ReminderQueueService],
})
export class QueueModule {}

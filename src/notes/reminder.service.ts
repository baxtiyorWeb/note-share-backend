import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './../users/entities/user.entity';
import { Repository } from 'typeorm';
import { OneSignalService } from './../onesignal/onesignal.service';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private oneSignalService: OneSignalService,
    @InjectRepository(UserEntity)
    private userRepo: Repository<UserEntity>,) { }

  async scheduleReminder(
    noteId: number,
    time: Date,
    message: string,
    userId: number,
  ) {
    const delay = time.getTime() - Date.now();
    if (delay <= 0) {
      this.logger.warn(`Reminder vaqt o'tgan: note #${noteId}`);
      return;
    }

    const timeout = setTimeout(async () => {
      this.logger.log(`Reminder for note #${noteId}: ${message}`);

      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (user?.onesignal_player_ids?.length) {
        await this.oneSignalService.sendPushNotification(
          user.onesignal_player_ids,
          'Note Eslatmasi',
          `Eslatma: ${message}`,
          { noteId: noteId.toString(), type: 'reminder' },
        );
      }
    }, delay);

    const timeoutName = `note-${noteId}`;
    this.schedulerRegistry.addTimeout(timeoutName, timeout);
    this.logger.log(`Reminder scheduled: ${time.toISOString()} (note #${noteId})`);
  }

  // Reminder ni o'chirish (update/delete da)
  cancelReminder(noteId: number) {
    const timeoutName = `note-${noteId}`;
    if (this.schedulerRegistry.doesExist('timeout', timeoutName)) {
      this.schedulerRegistry.deleteTimeout(timeoutName);
      this.logger.log(`Reminder cancelled: note #${noteId}`);
    }
  }
}

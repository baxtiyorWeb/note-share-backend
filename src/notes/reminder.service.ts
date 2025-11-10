import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { OneSignalService } from 'src/onesignal/onesignal.service';
import { UsersService } from 'src/users/users.service';

interface ScheduledReminder {
  noteId: number;
  userId: number;
  title: string;
  scheduleDate: Date;
  jobName: string;
}

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);
  private reminders: ScheduledReminder[] = [];

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private oneSignalService: OneSignalService,
    private usersService: UsersService,
  ) { }

  async scheduleReminder(noteId: number, date: Date, title: string, userId: number) {
    const jobName = `reminder-${noteId}`;

    if (date.getTime() <= Date.now()) {
      this.logger.warn(`⏳ O‘tgan vaqt uchun eslatma o‘rnatilmadi: ${date.toLocaleString()}`);
      return;
    }

    this.cancelReminder(noteId);

    const job = new CronJob(date, async () => {
      this.logger.log(`🔔 Eslatma vaqti keldi: ${title} (${noteId})`);

      const user = await this.usersService.findById(userId);
      const playerIds = user?.onesignal_player_ids || [];

      if (playerIds.length > 0) {
        await this.oneSignalService.sendPushNotification(
          playerIds,
          `🕓 Eslatma: ${title}`,
          `Siz ${title} nomli eslatmani belgilagan edingiz.`,
        );
      } else {
        this.logger.warn(`User ID ${userId} uchun Player ID topilmadi`);
      }

      this.cancelReminder(noteId);
    });

    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();

    this.reminders.push({
      noteId,
      userId,
      title,
      scheduleDate: date,
      jobName,
    });

    this.logger.log(`✅ Eslatma o‘rnatildi: ${title} (${date.toLocaleString()})`);
  }

  cancelReminder(noteId: number) {
    const jobName = `reminder-${noteId}`;
    try {
      this.schedulerRegistry.deleteCronJob(jobName);
      this.reminders = this.reminders.filter(r => r.noteId !== noteId);
      this.logger.log(`❌ Eslatma bekor qilindi: ${jobName}`);
      return true;
    } catch {
      return false;
    }
  }

  getScheduledReminders() {
    return this.reminders;
  }
}

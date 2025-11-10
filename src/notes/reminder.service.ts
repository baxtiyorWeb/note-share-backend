import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { OneSignalService } from 'src/onesignal/onesignal.service'; // 🔥 OneSignal servisining to'g'ri yo'lini tekshiring
import { UsersService } from 'src/users/users.service'; // Player ID olish uchun kerak

// Eslatmalarni xotirada saqlash uchun tip
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

  // 🔥 OneSignalService va UsersService ni inject qiling
  constructor(
    private schedulerRegistry: SchedulerRegistry,
    private oneSignalService: OneSignalService,
    private usersService: UsersService,
  ) { }

  async scheduleReminder(
    noteId: number,
    date: Date,
    title: string,
    userId: number,
  ) {
    const jobName = `reminder-${noteId}`;

    // Agar o'tmishdagi vaqt bo'lsa, eslatmani o'rnatmaslik
    if (date.getTime() <= Date.now()) {
      this.logger.warn(`Eslatma o'rnatilmadi (o'tgan vaqt): Note ID ${noteId}`);
      return;
    }

    const reminder: ScheduledReminder = {
      noteId,
      userId,
      title,
      scheduleDate: date,
      jobName,
    };

    // Cron formatiga o'tkazish (Sekund, Minut, Soat, Kun, Oy, Haftaning kuni)
    const cronTime = `${date.getSeconds()} ${date.getMinutes()} ${date.getHours()} ${date.getDate()} ${date.getMonth() + 1} *`;

    const job = new CronJob(date, async () => {
      this.logger.log(`🔔 Eslatma vaqti: Note ID ${noteId}, User ID ${userId}`);

      // 1. Foydalanuvchi Player ID sini olish
      const user = await this.usersService.findById(userId);
      const playerIds = user.onesignal_player_ids || [];

      if (playerIds.length > 0) {
        // 2. Push xabarnoma yuborish
        const response = await this.oneSignalService.sendPushNotification(
          playerIds,
          `📝 Eslatma: ${title}`,
          `Siz ${title} nomli eslatmangizni belgilagan edingiz.`,
        );
        this.logger.log(`Push yuborildi: ${JSON.stringify(response)}`);
      } else {
        this.logger.warn(`User ID ${userId} uchun Player ID topilmadi. Push yuborilmadi.`);
      }

      // 3. Eslatmani o'chirish
      this.cancelReminder(noteId);
    });

    // Eski reminderni o'chirish
    this.cancelReminder(noteId);

    // Yangi reminderni o'rnatish
    this.schedulerRegistry.addCronJob(jobName, job);
    job.start();
    this.reminders.push(reminder);
    this.logger.log(`✅ Eslatma o'rnatildi: Note ID ${noteId} vaqt: ${date.toLocaleString()}`);
  }

  cancelReminder(noteId: number) {
    const jobName = `reminder-${noteId}`;
    try {
      this.schedulerRegistry.deleteCronJob(jobName);
      this.reminders = this.reminders.filter(r => r.noteId !== noteId);
      this.logger.log(`Eslatma bekor qilindi: ${jobName}`);
      return true;
    } catch (e) {
      return false;
    }
  }

  getScheduledReminders() {
    return this.reminders;
  }
}
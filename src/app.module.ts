import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ScheduleModule } from "@nestjs/schedule";

// 🔹 Modullar
import { UsersModule } from "./users/users.module";
import { AuthModule } from "./auth/auth.module";
import { ProfileModule } from "./profile/profile.module";
import { NotesModule } from "./notes/notes.module";
import { DashboardModule } from "./dashboard/dashboard.module";
import { FileModule } from "./file/file.module";
import { FollowModule } from "./follow/follow.module";

// 🔹 Entity’lar
import { UserEntity } from "./users/entities/user.entity";
import { ProfileEntity } from "./profile/entities/profile.entity";
import { FileEntity } from "./file/entities/file.entity";
import { NotesEntity } from "./notes/entities/notes.entity";
import { NoteLikeEntity } from "./notes/entities/note-like.entity";
import { NoteCommentEntity } from "./notes/entities/note-comment.entity";
import { NoteViewEntity } from "./notes/entities/note-view.entity";
import { FollowEntity } from "./follow/entities/follow.entity";

// 🔹 Boshqa xizmatlar
import { OneSignalService } from "./onesignal/onesignal.service";
import { DashboardController } from "./dashboard/dashboard.controller";
import { NotificationModule } from './notification/notification.module';
import { ChatModule } from './chat/chat.module';
import { PinnedNoteEntity } from "./profile/entities/pinned-note.entity";
import { PaymentModule } from './payment/payment.module';
import { ExportService } from './export/export.service';
import { ExportModule } from './export/export.module';
import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    // 🔹 Global config
    ConfigModule.forRoot({ isGlobal: true }),

    // 🔹 TypeORM — avtomatik DATABASE_URL orqali
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: "postgres",
        url: config.get<string>("DATABASE_URL"),
        entities: [
          UserEntity,
          ProfileEntity,
          FileEntity,
          NotesEntity,
          NoteLikeEntity,
          NoteCommentEntity,
          NoteViewEntity,
          FollowEntity,
          PinnedNoteEntity
        ],
        autoLoadEntities: true,
        synchronize: true,
        ssl:
          config.get<string>("NODE_ENV") !== "production"
            ? { rejectUnauthorized: false }
            : false,
        logging: true,
      }),
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60, 
        limit: 10, 
      },
    ]),

    UsersModule,
    AuthModule,
    ProfileModule,
    NotesModule,
    DashboardModule,
    FileModule,
    FollowModule,
    NotificationModule,
    ChatModule,
    PaymentModule,
    ExportModule,
    CategoryModule,
  ],

  controllers: [DashboardController],

  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    OneSignalService,
    ExportService,
  ],
})
export class AppModule { }

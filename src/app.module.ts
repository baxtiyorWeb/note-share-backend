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
        ],
        autoLoadEntities: true,
        synchronize: config.get<string>("NODE_ENV") !== "production",
        ssl:
          config.get<string>("NODE_ENV") !== "production"
            ? { rejectUnauthorized: false }
            : false,
        logging: true,
      }),
    }),

    // 🔹 Soatli joblar uchun
    ScheduleModule.forRoot(),

    // 🔹 So‘rovni cheklovchi modul (rate limit)
    ThrottlerModule.forRoot([
      {
        ttl: 60, // 1 daqiqa
        limit: 10, // 10 ta so‘rov limit
      },
    ]),

    // 🔹 Bizning modullar
    UsersModule,
    AuthModule,
    ProfileModule,
    NotesModule,
    DashboardModule,
    FileModule,
    FollowModule,
  ],

  controllers: [DashboardController],

  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    OneSignalService,
  ],
})
export class AppModule { }

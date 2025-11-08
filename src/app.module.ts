import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProfileModule } from './profile/profile.module';
import { NotesModule } from './notes/notes.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FileModule } from './file/file.module';

import { UserEntity } from './users/entities/user.entity';
import { ProfileEntity } from './profile/entities/profile.entity';
import { NotesEntity } from './notes/entities/notes.entity';
import { NoteCommentEntity } from './notes/entities/note-comment.entity';
import { NoteViewEntity } from './notes/entities/note-view.entity';
import { NoteLikeEntity } from './notes/entities/note-like.entity';
import { FileEntity } from './file/entities/file.entity';
import { DashboardController } from './dashboard/dashboard.controller';
import { FollowModule } from './follow/follow.module';
import { FollowEntity } from './follow/entities/follow.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('DATABASE_URL'),
        entities: [
          UserEntity,
          ProfileEntity,
          FileEntity,
          NotesEntity,
          NoteLikeEntity,
          NoteCommentEntity,
          NoteViewEntity,
          FollowEntity
        ],
        autoLoadEntities: true,
        synchronize: true, // production’da false qilish tavsiya
        // ssl: { rejectUnauthorized: false }, // Neon/Railway’da kerak bo‘lishi mumkin
      }),
    }),

    ThrottlerModule.forRoot([
      { ttl: 60, limit: 10 },
    ]),

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
  ],
})
export class AppModule { }

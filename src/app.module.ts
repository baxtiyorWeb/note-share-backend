import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { UserEntity } from './users/entities/user.entity';
import { ProfileModule } from './profile/profile.module';
import { NotesService } from './notes/notes.service';
import { NotesModule } from './notes/notes.module';
import { ProfileEntity } from './profile/entities/profile.entity';
import { NotesEntity } from './notes/entities/notes.entity';
import { NoteCommentEntity } from './notes/entities/note-comment.entity';
import { NoteViewEntity } from './notes/entities/note-view.entity';
import { NoteLikeEntity } from './notes/entities/note-like.entity';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'notesharing',
      entities: [UserEntity, ProfileEntity, NotesEntity, NoteLikeEntity, NoteCommentEntity, NoteViewEntity],
      synchronize: true,
    }),
    UsersModule,
    AuthModule,
    ProfileModule,
    NotesModule,
    DashboardModule,
  ],
  controllers: [DashboardController],
})
export class AppModule { }

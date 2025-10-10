import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { ProfileEntity } from './entities/profile.entity';
import { NotesModule } from './../notes/notes.module';
import { NotesEntity } from './../notes/entities/notes.entity';
import { UserEntity } from './../users/entities/user.entity';
import { UploadService } from './../file/uploadService';

@Module({
  imports: [TypeOrmModule.forFeature([ProfileEntity, NotesEntity, UserEntity]), NotesModule],
  controllers: [ProfileController],
  providers: [ProfileService, UploadService],
  exports: [ProfileService,],
})
export class ProfileModule { }

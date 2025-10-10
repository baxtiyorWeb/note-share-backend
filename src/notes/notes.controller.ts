import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, ParseIntPipe, NotFoundException } from "@nestjs/common";
import { NotesService } from "./notes.service";
import { JwtAuthGuard } from "./../common/jwt-guard";
import { CreateNoteDto } from "./dto/note-create-dto";
import { UpdateNoteDto } from "./dto/not-update-dto";
import { ApiBearerAuth } from "@nestjs/swagger";
import type { Request } from "express";
import { ProfileEntity } from "./../profile/entities/profile.entity";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";



@Controller('notes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(
    private readonly notesService: NotesService,
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
  ) { }

  @Post()
  create(@Req() req, @Body() dto: CreateNoteDto) {
    return this.notesService.create(req.user.sub, dto);
  }

  @Get()
  findAll(@Req() req) {
    return this.notesService.findAllMyNotes(req.user.sub);
  }

  @Get('/shared-with-me')
  sharedWithMe(@Req() req) {
    return this.notesService.sharedWithMe(req.user.sub);
  }

  @Get(":id")
  findOne(@Req() req, @Param("id") id: number) {

    return this.notesService.findOne(req.user.sub, id);
  }

  @Patch(":id")
  update(@Req() req, @Param("id") id: number, @Body() dto: UpdateNoteDto) {
    return this.notesService.update(req.user.sub, id, dto);
  }

  @Delete(":id")
  remove(@Req() req, @Param("id") id: number) {
    return this.notesService.remove(req.user.sub, id);
  }

  @Post(':id/share')
  async shareNote(
    @Param('id', ParseIntPipe) noteId: number,
    @Body('targetProfileId', ParseIntPipe) targetProfileId: number,
    @Req() req: Request,
  ) {
    const ownerId = req.user?.['sub']; // token orqali foydalanuvchi ID
    const ownerProfile = await this.profileRepo.findOne({
      where: { user: { id: ownerId } },
    });

    if (!ownerProfile) {
      throw new NotFoundException('Profile not found for current user');
    }

    return this.notesService.shareNote(noteId, targetProfileId, ownerProfile.id);
  }

}

// src/notes/notes.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { NotesService } from './notes.service';
import { JwtAuthGuard } from '../common/jwt-strategy/jwt-guards';
import { PremiumGuard } from '../common/guards/premium.guard';
import { CreateNoteDto } from './dto/note-create-dto';
import { UpdateNoteDto } from './dto/not-update-dto';
import { ShareNoteDto } from './dto/note-share-dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiResponse,
} from '@nestjs/swagger';

@ApiBearerAuth()
@ApiTags('Notes')
@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) { }

  @Post()
  @ApiOperation({ summary: 'Yangi note yaratish' })
  create(@Req() req, @Body() dto: CreateNoteDto) {
    return this.notesService.create(req.user.sub, dto);
  }

  @Post('schedule')
  @UseGuards(PremiumGuard)
  @ApiOperation({ summary: 'Keyinroq post qilish' })
  schedule(@Req() req, @Body() dto: CreateNoteDto) {
    return this.notesService.schedule(req.user.sub, dto);
  }

  @Get('drafts')
  @ApiOperation({ summary: 'Loyihalar' })
  getDrafts(@Req() req) {
    return this.notesService.getDrafts(req.user.sub);
  }

  @Get()
  @ApiOperation({ summary: 'Mening notelarim' })
  findAll(@Req() req) {
    return this.notesService.findAllMyNotes(req.user.sub);
  }

  @Get('shared-with-me')
  @ApiOperation({ summary: 'Menga ulashilganlar' })
  sharedWithMe(@Req() req) {
    return this.notesService.sharedWithMe(req.user.sub);
  }

  @Get('explore')
  @ApiOperation({ summary: 'Ommaviy feed' })
  getExplore(
    @Query('sort') sort?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('size') size = 10,
  ) {
    return this.notesService.getExploreNotes(sort, search, +page, +size);
  }

  @Get('news')
  @ApiOperation({ summary: 'Yangiliklar' })
  getNews(@Query('page') page = 1, @Query('size') size = 10) {
    return this.notesService.getExploreNotes('latest', undefined, +page, +size, 'news');
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'SEO URL orqali note' })
  getBySlug(@Param('slug') slug: string) {
    return this.notesService.getBySlug(slug);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Bitta note' })
  findOne(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.findOne(req.user.sub, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Note yangilash' })
  update(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: UpdateNoteDto) {
    return this.notesService.update(req.user.sub, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Note o‘chirish' })
  remove(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.remove(req.user.sub, id);
  }

  @Post(':id/share')
  @ApiOperation({ summary: 'Ulashish' })
  share(@Req() req, @Param('id', ParseIntPipe) id: number, @Body() dto: ShareNoteDto) {
    return this.notesService.shareNote(id, dto.targetProfileId, req.user.sub);
  }

  @Post(':id/save')
  @ApiOperation({ summary: 'Saqlash' })
  save(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.saveNote(req.user.sub, id);
  }

  @Delete(':id/save')
  @ApiOperation({ summary: 'Saqlanganni o‘chirish' })
  unsave(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.unsaveNote(req.user.sub, id);
  }

  @Get('saved-notes')
  @ApiOperation({ summary: 'Saqlanganlar' })
  getSaved(@Req() req) {
    return this.notesService.findAllSavedNotes(req.user.sub);
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Like' })
  like(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.notesService.toggleLike(req.user.sub, id);
  }

  @Patch(':id/paywall')
  @UseGuards(PremiumGuard)
  @ApiOperation({ summary: 'Paywall qo‘yish' })
  setPaywall(@Req() req, @Param('id') id: number, @Body('price') price: string) {
    return this.notesService.setPaywall(req.user.sub, id, price);
  }

  @Post(':id/repost')
  @ApiOperation({ summary: 'Repost' })
  repost(@Req() req, @Param('id') id: number, @Body('quote') quote?: string) {
    return this.notesService.repost(req.user.sub, id, quote);
  }

  @Post(':id/ai-summary')
  @UseGuards(PremiumGuard)
  @ApiOperation({ summary: 'AI xulosa' })
  aiSummary(@Param('id') id: number) {
    return this.notesService.generateAISummary(id);
  }

  @Get(':id/analytics')
  @UseGuards(PremiumGuard)
  @ApiOperation({ summary: 'Analitika' })
  analytics(@Req() req, @Param('id') id: number) {
    return this.notesService.getAnalytics(req.user.sub, id);
  }

  @Get(':id/export/:format')
  @UseGuards(PremiumGuard)
  @ApiOperation({ summary: 'Eksport' })
  export(@Req() req, @Param('id') id: number, @Param('format') format: 'pdf' | 'json') {
    return this.notesService.exportNote(req.user.sub, id, format);
  }
}
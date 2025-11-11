import { IsBoolean, IsDateString, IsNotEmpty, IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateNoteDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsBoolean()
  is_code_mode?: boolean;

  @IsOptional()
  @IsString()
  code_language?: string | null;

  @IsOptional()
  @IsDateString()
  reminder_at?: string;

  // 🆕 Qo‘shimcha maydonlar
  @IsOptional()
  @IsString()
  seo_slug?: string;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsIn(['public', 'private', 'unlisted'])
  visibility?: 'public' | 'private' | 'unlisted';

  @IsOptional()
  @IsBoolean()
  allow_comments?: boolean;

  @IsOptional()
  @IsBoolean()
  share_to_twitter?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

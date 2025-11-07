import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateNoteDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsBoolean()
  is_code_mode?: boolean;

  @IsOptional()
  @IsString()
  code_language?: string | null;
}

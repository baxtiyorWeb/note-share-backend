import { IsArray, IsInt, ArrayNotEmpty } from "class-validator";

export class ShareNoteDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  profileIds: number[];
}

import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsNotEmpty } from "class-validator";

export class ShareNoteDto {
  @ApiProperty({
    example: 12,
    description: "Note kimga ulashilayotganini bildiruvchi target profile ID",
  })
  @Type(() => Number)
  @IsInt()
  @IsNotEmpty()
  targetProfileId: number;
}

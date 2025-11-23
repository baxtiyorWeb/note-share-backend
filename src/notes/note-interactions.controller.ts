import {
  Controller,
  Post,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
  ParseIntPipe,
  Get,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiBody } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/jwt-strategy/jwt-guards";
import { NoteInteractionsService } from "./note-interactions.service";

@ApiTags("Notes Interactions")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notes/:noteId")
export class NoteInteractionsController {
  constructor(private readonly service: NoteInteractionsService) { }

  @Post("view")
  @ApiOperation({ summary: "Add a view to a note" })
  @ApiParam({ name: "noteId", type: Number, description: "Note ID" })
  addView(@Req() req, @Param("noteId", ParseIntPipe) noteId: number) {
    return this.service.addView(noteId, req.user.sub);
  }

  @Post("like")
  @ApiOperation({ summary: "Toggle like for a note" })
  @ApiParam({ name: "noteId", type: Number, description: "Note ID" })
  toggleLike(@Req() req, @Param("noteId", ParseIntPipe) noteId: number) {
    return this.service.toggleLike(noteId, req.user.sub);
  }
  @Post("comment/:commentId/reply")
  @ApiOperation({ summary: "Reply to a comment" })
  @ApiParam({ name: "noteId", type: Number, description: "Note ID" })
  @ApiParam({ name: "commentId", type: Number, description: "Parent comment ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        text: { type: "string", example: "I totally agree!" },
      },
      required: ["text"],
    },
  })
  replyToComment(
    @Req() req,
    @Param("noteId", ParseIntPipe) noteId: number,
    @Param("commentId", ParseIntPipe) commentId: number,
    @Body("text") text: string,
  ) {
    return this.service.replyToComment(noteId, req.user.sub, commentId, text);
  }


  @Post("comment")
  @ApiOperation({ summary: "Add a comment to a note" })
  @ApiParam({ name: "noteId", type: Number, description: "Note ID" })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        text: { type: "string", example: "This note is really helpful!" },
      },
      required: ["text"],
    },
  })
  addComment(
    @Req() req,
    @Param("noteId", ParseIntPipe) noteId: number,
    @Body("text") text: string,
  ) {
    console.log(req.user);

    return this.service.addComment(noteId, req.user.sub, text);
  }

  @Get("comments")
  @ApiOperation({ summary: "Get all comments for a note" })
  @ApiParam({ name: "noteId", type: Number, description: "Note ID" })
  getComments(@Param("noteId", ParseIntPipe) noteId: number) {
    return this.service.getComments(noteId);
  }

  @Delete("comment/:commentId")
  @ApiOperation({ summary: "Delete your own comment from a note" })
  @ApiParam({ name: "commentId", type: Number, description: "Comment ID" })
  deleteComment(
    @Req() req,
    @Param("commentId", ParseIntPipe) commentId: number,
  ) {


    return this.service.deleteComment(commentId, req.user.sub);
  }
}

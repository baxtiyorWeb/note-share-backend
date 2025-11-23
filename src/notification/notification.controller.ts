import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Req,
  UseGuards,
  ParseIntPipe,
} from "@nestjs/common";
import { NotificationService } from "./notification.service";
import { JwtAuthGuard } from "../common/jwt-strategy/jwt-guards";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

@ApiTags("Notifications")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @Get()
  @ApiOperation({ summary: "Get all notifications for current user" })
  getAll(@Req() req) {
    return this.notificationService.getAll(req.user.sub);
  }

  @Patch(":id/read")
  @ApiOperation({ summary: "Mark a single notification as read" })
  markAsRead(@Req() req, @Param("id", ParseIntPipe) id: number) {
    return this.notificationService.markAsRead(id, req.user.sub);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  markAll(@Req() req) {
    return this.notificationService.markAllAsRead(req.user.sub);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete a notification" })
  deleteOne(@Req() req, @Param("id", ParseIntPipe) id: number) {
    return this.notificationService.deleteOne(id, req.user.sub);
  }

  @Delete()
  @ApiOperation({ summary: "Delete all notifications" })
  deleteAll(@Req() req) {
    return this.notificationService.deleteAll(req.user.sub);
  }
}

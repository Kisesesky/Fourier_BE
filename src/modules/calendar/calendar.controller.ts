// src/modules/calendar/calendar.controller.ts
import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CalendarEventResponseDto } from './dto/calendar-event-response.dto';

@UseGuards(JwtAuthGuard)
@ApiTags('calendar')
@Controller('project/:projectId/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiOperation({ summary: '캘린더 이벤트 추가'})
  @ApiOkResponse({ type: CalendarEventResponseDto })
  @Post()
  createEvent(
    @Param('projectId') projectId: string,
    @Body() createCalendarEventDto: CreateCalendarEventDto,
    @RequestUser() user: User
  ) {
    return this.calendarService.createEvent(projectId, createCalendarEventDto, user);
  }

  @ApiOperation({ summary: '캘린더 이벤트 목록'})
  @ApiOkResponse({ type: [CalendarEventResponseDto] })
  @Get()
  getEvents(
    @Param('projectId') projectId: string,
    @RequestUser() user: User
  ) {
    return this.calendarService.getProjectEvents(projectId, user);
  }

  @ApiOperation({ summary: '캘린더 이벤트 수정'})
  @ApiOkResponse({ type: CalendarEventResponseDto })
  @Patch(':eventId')
  updateEvent(
    @Param('eventId') eventId: string,
    @Body() updateCalendarEventDto: UpdateCalendarEventDto,
    @RequestUser() user: User
  ) {
    return this.calendarService.updateEvent(eventId, updateCalendarEventDto, user);
  }

  @ApiOperation({ summary: '캘린더 이벤트 삭제'})
  @Delete(':eventId')
  deleteEvent(
    @Param('eventId') eventId: string,
    @RequestUser() user: User
  ) {
    return this.calendarService.deleteEvent(eventId, user);
  }
}
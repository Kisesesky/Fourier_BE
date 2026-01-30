// src/modules/calendar/calendar.controller.ts
import { Controller, Post, Get, Patch, Delete, Param, Body, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RequestUser } from 'src/common/decorators/request-user.decorator';
import { User } from '../users/entities/user.entity';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CalendarEventResponseDto } from './dto/calendar-event-response.dto';
import { CreateCalendarCategoryDto } from './dto/create-calendar-category.dto';
import { UpdateCalendarCategoryDto } from './dto/update-calendar-category.dto';

@ApiTags('calendar')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('access-token')
@Controller('projects/:projectId/calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @ApiOperation({ summary: '캘린더 이벤트 생성'})
  @ApiOkResponse({ type: CalendarEventResponseDto })
  @Post('events')
  createEvent(
    @Param('projectId') projectId: string,
    @Body() createCalendarEventDto: CreateCalendarEventDto,
    @RequestUser() user: User
  ) {
    return this.calendarService.createEvent(projectId, createCalendarEventDto, user);
  }

  @ApiOperation({ summary: '캘린더 이벤트 목록 조회'})
  @ApiOkResponse({ type: [CalendarEventResponseDto] })
  @Get('events')
  getEvents(
    @Param('projectId') projectId: string,
    @RequestUser() user: User
  ) {
    return this.calendarService.getProjectEvents(projectId, user);
  }

  @ApiOperation({ summary: '캘린더 분석 집계' })
  @Get('analytics')
  getEventAnalytics(
    @Param('projectId') projectId: string,
    @RequestUser() user: User,
    @Query('granularity') granularity: 'hourly' | 'daily' | 'monthly',
    @Query('date') date?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    if (!granularity) throw new BadRequestException('granularity is required');
    return this.calendarService.getEventAnalytics(projectId, user, { granularity, date, month, year });
  }

  @ApiOperation({ summary: '캘린더 이벤트 수정'})
  @ApiOkResponse({ type: CalendarEventResponseDto })
  @Patch('events/:eventId')
  updateEvent(
    @Param('eventId') eventId: string,
    @Body() updateCalendarEventDto: UpdateCalendarEventDto,
    @RequestUser() user: User
  ) {
    return this.calendarService.updateEvent(eventId, updateCalendarEventDto, user);
  }

  @ApiOperation({ summary: '캘린더 이벤트 삭제'})
  @Delete('events/:eventId')
  deleteEvent(
    @Param('eventId') eventId: string,
    @RequestUser() user: User
  ) {
    return this.calendarService.deleteEvent(eventId, user);
  }

  @ApiOperation({ summary: '캘린더 카테고리 목록' })
  @Get('categories')
  getCategories(
    @Param('projectId') projectId: string,
    @RequestUser() user: User,
  ) {
    return this.calendarService.getCategories(projectId, user);
  }

  @ApiOperation({ summary: '캘린더 카테고리 생성' })
  @Post('categories')
  createCategory(
    @Param('projectId') projectId: string,
    @Body() createCalendarCategoryDto: CreateCalendarCategoryDto,
    @RequestUser() user: User,
  ) {
    return this.calendarService.createCategory(projectId, createCalendarCategoryDto, user);
  }

  @ApiOperation({ summary: '캘린더 카테고리 수정' })
  @Patch('categories/:categoryId')
  updateCategory(
    @Param('categoryId') categoryId: string,
    @Body() updateCalendarCategoryDto: UpdateCalendarCategoryDto,
    @RequestUser() user: User,
  ) {
    return this.calendarService.updateCategory(categoryId, updateCalendarCategoryDto, user);
  }

  @ApiOperation({ summary: '캘린더 카테고리 비활성화' })
  @Delete('categories/:categoryId')
  deleteCategory(
    @Param('categoryId') categoryId: string,
    @RequestUser() user: User,
  ) {
    return this.calendarService.deleteCategory(categoryId, user);
  }

  @ApiOperation({ summary: '캘린더 수정' })
  @Patch('events/:eventId/issue-dates')
  async updateIssueDatesFromCalendar(
    @Param('eventId') eventId: string,
    @Body() body: { startAt: string; endAt: string }
  ) {
    return this.calendarService.updateIssueDatesFromCalendar(
      eventId,
      body.startAt,
      body.endAt,
    );
  }
}

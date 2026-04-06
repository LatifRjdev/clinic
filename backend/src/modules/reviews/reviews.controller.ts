import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { User } from '../auth/entities/user.entity';
import { UserRole } from '../../common/enums/roles.enum';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Get('public/doctors/:doctorId/reviews')
  @ApiOperation({ summary: 'Get approved reviews for a doctor (public)' })
  getForDoctor(@Param('doctorId') doctorId: string) {
    return this.reviewsService.getForDoctor(doctorId);
  }

  @Get('public/doctors/:doctorId/rating')
  @ApiOperation({ summary: 'Get doctor rating (public)' })
  getDoctorRating(@Param('doctorId') doctorId: string) {
    return this.reviewsService.getDoctorRating(doctorId);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review (patient only)' })
  createReview(
    @CurrentUser() user: User,
    @Body() body: { doctorId: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.create(
      user.id,
      body.doctorId,
      body.rating,
      body.comment,
    );
  }

  @Patch('reviews/:id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a review (admin/owner only)' })
  approveReview(@Param('id') id: string) {
    return this.reviewsService.approve(id);
  }

  @Delete('reviews/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (soft delete)' })
  removeReview(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}

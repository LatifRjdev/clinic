import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {}

  async getForDoctor(doctorId: string): Promise<Review[]> {
    return this.reviewRepository.find({
      where: { doctorId, isApproved: true },
      relations: ['patient'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDoctorRating(
    doctorId: string,
  ): Promise<{ avgRating: number; totalReviews: number }> {
    const result = await this.reviewRepository
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avgRating')
      .addSelect('COUNT(r.id)', 'totalReviews')
      .where('r.doctorId = :doctorId', { doctorId })
      .andWhere('r.isApproved = true')
      .getRawOne();

    return {
      avgRating: result.avgRating ? parseFloat(Number(result.avgRating).toFixed(1)) : 0,
      totalReviews: parseInt(result.totalReviews, 10),
    };
  }

  async create(
    patientId: string,
    doctorId: string,
    rating: number,
    comment?: string,
  ): Promise<Review> {
    const review = this.reviewRepository.create({
      patientId,
      doctorId,
      rating,
      comment: comment || null,
      isApproved: false,
    });

    return this.reviewRepository.save(review);
  }

  async approve(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    review.isApproved = true;
    return this.reviewRepository.save(review);
  }

  async remove(id: string): Promise<void> {
    const review = await this.reviewRepository.findOne({ where: { id } });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    await this.reviewRepository.softRemove(review);
  }
}

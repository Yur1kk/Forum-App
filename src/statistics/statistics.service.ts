import { Injectable, BadRequestException } from '@nestjs/common'; 
import { PrismaService } from '../../prisma/prisma.service'; 
import { sub } from 'date-fns';

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  async getUserActivityStatistics(
    userId: number,
    period: string,
    interval: string,
    isAdmin: boolean
  ) {
    const now = new Date();
    const periodStart = this.getPeriodStart(period, now);

    const types = ['posts', 'likes', 'comments'];
    const statistics = {};

    for (const statType of types) {
      const whereCondition = this.createWhereCondition(userId, null, statType, periodStart, now, isAdmin);
      statistics[statType] = await this.fetchStatistics(statType, whereCondition, interval);
    }

    return { userId, period, interval, statistics };
  }

  async getPostActivityStatistics(
    postId: number | null,
    period: string,
    interval: string,
    isAdmin: boolean
  ) {
    const now = new Date();
    const periodStart = this.getPeriodStart(period, now);

    const types = ['likes', 'comments'];
    const statistics = {};

    if (postId === null) {
      return { postId: null, period, interval, statistics: {} };
    }

    for (const statType of types) {
      const whereCondition = this.createWhereCondition(null, postId, statType, periodStart, now, isAdmin);
      statistics[statType] = await this.fetchStatistics(statType, whereCondition, interval);
    }

    return { postId, period, interval, statistics };
  }

  private createWhereCondition(
    userId: number | null,
    postId: number | null,
    type: string,
    periodStart: Date,
    periodEnd: Date,
    isAdmin: boolean
  ) {
    const baseCondition = { createdAt: { gte: periodStart, lte: periodEnd } };

    if (type === 'posts' && userId) {
      return { ...baseCondition, authorId: userId };
    }
    if (type === 'likes') {
      return { ...baseCondition, ...(userId && { userId }), ...(postId && { postId }) };
    }
    if (type === 'comments') {
      return { ...baseCondition, ...(userId && { userId }), ...(postId && { postId }) };
    }
    throw new BadRequestException('Invalid type.');
  }

  private async fetchStatistics(
    type: string,
    whereCondition: any,
    interval: string,
  ) {
    let results;

    if (type === 'posts') {
      results = await this.prisma.post.findMany({
        where: whereCondition,
        select: { createdAt: true },
      });
    } else if (type === 'likes') {
      results = await this.prisma.likes.findMany({
        where: whereCondition,
        select: { createdAt: true },
      });
    } else if (type === 'comments') {
      results = await this.prisma.comments.findMany({
        where: whereCondition,
        select: { createdAt: true },
      });
    } else {
      throw new BadRequestException('Invalid type.');
    }

    return this.aggregateStatistics(results, interval);
  }

  private aggregateStatistics(results: { createdAt: Date }[], interval: string) {
    const aggregatedData = {};

    results.forEach(result => {
      const date = this.formatDateByInterval(result.createdAt, interval);
      aggregatedData[date] = (aggregatedData[date] || 0) + 1;
    });

    return Object.entries(aggregatedData).map(([label, count]) => ({ 
        label,
        count,
    }));
  }

  private formatDateByInterval(date: Date, interval: string): string {
    switch (interval) {
      case 'hour': return date.toISOString().slice(0, 13);
      case 'day': return date.toISOString().slice(0, 10);
      case 'week': {
        const startOfWeek = sub(date, { days: date.getDay() });
        return startOfWeek.toISOString().slice(0, 10);
      }
      case 'month': return date.toISOString().slice(0, 7);
      default: throw new BadRequestException('Invalid interval.');
    }
  }

  private getPeriodStart(period: string, now: Date): Date {
    switch (period) {
      case 'day': return sub(now, { days: 1 });
      case 'week': return sub(now, { weeks: 1 });
      case 'month': return sub(now, { months: 1 });
      case 'half-year': return sub(now, { months: 6 });
      default: throw new BadRequestException('Invalid period.');
    }
  }

  async getPostById(postId: number) {
    return this.prisma.post.findUnique({ where: { id: postId } });
  }
}
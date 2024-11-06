import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { sub } from 'date-fns';

@Injectable()
export class StatisticsService {
    constructor(private prisma: PrismaService) {}

    async getUserActivityStatistics(
        userId: number,
        period: string,
        type: string,
        interval: string,
    ) {
        const now = new Date();
        const periodStart = this.getPeriodStart(period, now);

        const validTypes = ['posts', 'likes', 'comments'];
        const types = type.split(',').map(t => t.toLowerCase()).filter(t => validTypes.includes(t));
        if (types.length === 0) throw new BadRequestException('Invalid type.');

        const statistics = {};

        for (const statType of types) {
            const data = await this.fetchStatistics(userId, statType, periodStart, now, interval);
            statistics[statType] = data;
        }

        return { userId, period, interval, statistics };
    }

    private async fetchStatistics(
        userId: number,
        type: string,
        periodStart: Date,
        periodEnd: Date,
        interval: string,
    ) {
        let model;
        let whereCondition;

        switch (type) {
            case 'posts':
                model = this.prisma.post;
                whereCondition = {
                    authorId: userId, 
                    createdAt: {
                        gte: periodStart,
                        lte: periodEnd,
                    },
                };
                break;
            case 'likes':
                model = this.prisma.likes;
                whereCondition = {
                    userId: userId, 
                    createdAt: {
                        gte: periodStart,
                        lte: periodEnd,
                    },
                };
                break;
            case 'comments':
                model = this.prisma.comments;
                whereCondition = {
                    userId: userId, 
                    createdAt: {
                        gte: periodStart,
                        lte: periodEnd,
                    },
                };
                break;
            default:
                throw new BadRequestException('Invalid type.');
        }


        const results = await model.findMany({
            where: whereCondition,
            select: {
                createdAt: true,
            },
        });

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
            case 'hour':
                return date.toISOString().slice(0, 13);
            case 'day':
                return date.toISOString().slice(0, 10);
            case 'week':
                const startOfWeek = sub(date, { days: date.getDay() });
                return startOfWeek.toISOString().slice(0, 10);
            case 'month':
                return date.toISOString().slice(0, 7);
            default:
                throw new BadRequestException('Invalid interval.');
        }
    }

      private getPeriodStart(period: string, now: Date): Date {
        switch (period) {
          case 'day':
            return sub(now, { days: 1 });
          case 'week':
            return sub(now, { weeks: 1 });
          case 'month':
            return sub(now, { months: 1 });
          case 'half-year':
            return sub(now, { months: 6 });
          default:
            throw new BadRequestException('Invalid period.');
        }
      }
    
}
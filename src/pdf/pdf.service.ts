import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatisticsService } from '../statistics/statistics.service';
import { DropboxService } from './dropbox.service';
import * as Mustache from 'mustache';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'date-fns';

@Injectable()
export class PdfService {
  constructor(
    private prisma: PrismaService,
    private statisticsService: StatisticsService,
    private dropboxService: DropboxService,
  ) {}

  async generatePdfReport(
    userId: number,
    startDate: string,
    endDate: string,
    interval: string,
    isAdmin: boolean
  ): Promise<string> {
    const parsedStartDate = parse(startDate, 'yyyy-MM-dd', new Date());
    const parsedEndDate = parse(endDate, 'yyyy-MM-dd', new Date());

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    const templatePath = path.join(process.cwd(), 'src', 'pdf', 'templates', 'template.html');
    const template = fs.readFileSync(templatePath, 'utf8');

    const flattenedStatisticsData = await this.statisticsService.getUserActivityStatistics(
      userId,
      parsedStartDate,
      parsedEndDate,
      interval,
      isAdmin
    );

    const html = Mustache.render(template, {
      type: 'User',
      period: `${startDate} to ${endDate}`,
      interval,
      statisticsData: flattenedStatisticsData.statistics,
      userId: userId,
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    const buffer = Buffer.from(pdfBuffer);

    const dropboxLink = await this.dropboxService.uploadBuffer(buffer, `user_${userId}_statistics.pdf`);

    await this.savePdfUrlToDatabase(userId, dropboxLink);

    return dropboxLink;
  }

  async getPdfUrl(userId?: number): Promise<string> {
    if (userId) {
      const pdfRecord = await this.prisma.statisticsPdfUrl.findFirst({
        where: { userId: userId },
        select: { url: true },
      });
      if (pdfRecord && pdfRecord.url) return pdfRecord.url;
      throw new NotFoundException('PDF URL not found for this user.');
    }
    throw new BadRequestException('User ID is required.');
  }

  private async savePdfUrlToDatabase(userId: number, url: string): Promise<void> {
    try {
      await this.prisma.statisticsPdfUrl.create({
        data: {
          userId: userId,
          url: url,
        },
      });
    } catch (error) {
      throw new Error('Failed to save PDF URL to database: ' + error.message);
    }
  }
  
}

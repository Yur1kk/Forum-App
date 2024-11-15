import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatisticsService } from '../statistics/statistics.service';
import { DropboxService } from './dropbox.service';
import * as Mustache from 'mustache';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'date-fns';
import { format } from 'date-fns';

@Injectable()
export class PdfService {
  constructor(
    private prisma: PrismaService,
    private statisticsService: StatisticsService,
    private dropboxService: DropboxService,
  ) {}


  async generatePdfReport(
    userId: number | null,
    postId: number | null,
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


    let flattenedStatisticsData;
    if (userId) {
      flattenedStatisticsData = await this.statisticsService.getUserActivityStatistics(userId, parsedStartDate, parsedEndDate, interval, isAdmin);
    } else if (postId) {
      flattenedStatisticsData = await this.statisticsService.getPostActivityStatistics(postId, parsedStartDate, parsedEndDate, interval, isAdmin);
    } else {
      throw new BadRequestException('Either userId or postId must be provided');
    }


    const html = Mustache.render(template, {
      type: userId ? 'User' : 'Post',
      period: `${startDate} to ${endDate}`,
      interval,
      statisticsData: flattenedStatisticsData.statistics,
      userId,
      postId,
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
    const now = new Date();
    const formattedDate = format(now, 'yyyy-MM-dd_HH-mm-ss');
    const filename = userId 
  ? `user_${userId}_statistics_${formattedDate}.pdf` 
  : `post_${postId}_statistics_${formattedDate}.pdf`;
    const dropboxLink = await this.dropboxService.uploadBuffer(buffer, filename);


    if (userId) {
      await this.savePdfUrlToDatabase(userId, dropboxLink);
    } else if (postId) {
      await this.savePostPdfUrlToDatabase(postId, dropboxLink);
    }

    return dropboxLink;
  }


  async getPdfUrl(userId?: number, postId?: number): Promise<string> {
    if (userId) {
      const pdfRecord = await this.prisma.statisticsPdfUrl.findFirst({
        where: { userId: userId },
        orderBy: {
          generatedAt: 'desc',  
        },
        select: { url: true },
      });
      if (pdfRecord && pdfRecord.url) {
        return pdfRecord.url;
      }
      throw new NotFoundException('PDF URL not found for this user.');
    } else if (postId) {
      const pdfRecord = await this.prisma.postStatisticsPdfUrl.findFirst({
        where: { postId: postId },
        orderBy: {
          generatedAt: 'desc',  
        },
        select: { url: true },
      });
      if (pdfRecord && pdfRecord.url) {
        return pdfRecord.url;
      }
      throw new NotFoundException('PDF URL not found for this post.');
    }
    throw new BadRequestException('User ID or Post ID is required.');
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
  

  private async savePostPdfUrlToDatabase(postId: number, url: string): Promise<void> {
    try {
      await this.prisma.postStatisticsPdfUrl.create({
        data: {
          postId: postId,
          url: url,
        },
      });
    } catch (error) {
      throw new Error('Failed to save Post PDF URL to database: ' + error.message);
    }
  }
}

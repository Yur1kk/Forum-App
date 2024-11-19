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
import { FollowersService } from 'src/followers/followers.service';

@Injectable()
export class PdfService {
  constructor(
    private prisma: PrismaService,
    private statisticsService: StatisticsService,
    private dropboxService: DropboxService,
    private followersService: FollowersService
  ) {}

 
  async generateUserPdfReport(
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
    let flattenedStatisticsData = await this.statisticsService.getUserActivityStatistics(userId, parsedStartDate, parsedEndDate, interval, isAdmin);

  
    if (!flattenedStatisticsData || !flattenedStatisticsData.statistics) {
      throw new NotFoundException('No statistics data found for the user.');
    }


    const followersCount = await this.followersService.countFollowers(userId);
    const followingCount = await this.followersService.countFollowing(userId);
    flattenedStatisticsData.followersCount = followersCount;
    flattenedStatisticsData.followingCount = followingCount;

    return this.generateUserPdfFromData(
      flattenedStatisticsData, 
      userId, 
      templatePath, 
      startDate, 
      endDate, 
      interval
    );
  }


  async generatePostPdfReport(
    postId: number,
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


    const flattenedStatisticsData = await this.statisticsService.getPostActivityStatistics(postId, parsedStartDate, parsedEndDate, interval, isAdmin);


    if (!flattenedStatisticsData || !flattenedStatisticsData.statistics) {
      throw new NotFoundException('No statistics data found for the post.');
    }

    const templatePath = path.join(process.cwd(), 'src', 'pdf', 'templates', 'template2.html');


    return this.generatePostPdfFromData(
      flattenedStatisticsData, 
      postId, 
      templatePath, 
      startDate, 
      endDate, 
      interval
    );
  }


 
private async generateUserPdfFromData(
  flattenedStatisticsData: any,
  userId: number,
  templatePath: string,
  startDate: string,
  endDate: string,
  interval: string
): Promise<string> {
  if (!fs.existsSync(templatePath)) {
    throw new NotFoundException('Template file not found.');
  }

 
  const sortByDate = (a, b) => {
    const dateA = a.label ? new Date(a.label) : null;
    const dateB = b.label ? new Date(b.label) : null;

    if (!dateA || !dateB || isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      throw new BadRequestException('Invalid or missing date format in statistics data');
    }

    return dateA.getTime() - dateB.getTime();
  };

  
  if (flattenedStatisticsData.statistics.likes) {
    flattenedStatisticsData.statistics.likes.sort(sortByDate);
  }
  if (flattenedStatisticsData.statistics.comments) {
    flattenedStatisticsData.statistics.comments.sort(sortByDate);
  }
  if (flattenedStatisticsData.statistics.posts) {
    flattenedStatisticsData.statistics.posts.sort(sortByDate);
  }

  
  const template = fs.readFileSync(templatePath, 'utf8');
  const html = Mustache.render(template, {
    type: 'User',
    period: `${startDate} to ${endDate}`,
    interval,
    statisticsData: flattenedStatisticsData.statistics,
    followersCount: flattenedStatisticsData.followersCount,
    followingCount: flattenedStatisticsData.followingCount,
    userId,
    postsJson: JSON.stringify(flattenedStatisticsData.statistics.posts),
    likesJson: JSON.stringify(flattenedStatisticsData.statistics.likes),
    commentsJson: JSON.stringify(flattenedStatisticsData.statistics.comments),
  });

  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = Buffer.from(await page.pdf({ format: 'A4' }));
  await browser.close();

  
  const now = new Date();
  const formattedDate = format(now, 'yyyy-MM-dd_HH-mm-ss');
  const filename = `user_${userId}_statistics_${formattedDate}.pdf`;

  
  const dropboxLink = await this.dropboxService.uploadBuffer(pdfBuffer, filename);
  await this.savePdfUrlToDatabase(userId, dropboxLink);

  return dropboxLink;
}


private async generatePostPdfFromData(
  flattenedStatisticsData: any,
  postId: number,
  templatePath: string,
  startDate: string,
  endDate: string,
  interval: string
): Promise<string> {
  if (!fs.existsSync(templatePath)) {
    throw new NotFoundException('Template file not found.');
  }

  
  const sortByDate = (a, b) => {
    const dateA = a.label ? new Date(a.label) : null;
    const dateB = b.label ? new Date(b.label) : null;

    if (!dateA || !dateB || isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
      throw new BadRequestException('Invalid or missing date format in statistics data');
    }

    return dateA.getTime() - dateB.getTime();
  };

  
  if (flattenedStatisticsData.statistics.likes) {
    flattenedStatisticsData.statistics.likes.sort(sortByDate);
  }
  if (flattenedStatisticsData.statistics.comments) {
    flattenedStatisticsData.statistics.comments.sort(sortByDate);
  }

  
  const template = fs.readFileSync(templatePath, 'utf8');
  const html = Mustache.render(template, {
    type: 'Post',
    period: `${startDate} to ${endDate}`,
    interval,
    statisticsData: flattenedStatisticsData.statistics,
    postId,
    likesData: JSON.stringify(flattenedStatisticsData.statistics.likes),
    commentsData: JSON.stringify(flattenedStatisticsData.statistics.comments),
  });


  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setContent(html);
  const pdfBuffer = Buffer.from(await page.pdf({ format: 'A4' }));
  await browser.close();


  const now = new Date();
  const formattedDate = format(now, 'yyyy-MM-dd_HH-mm-ss');
  const filename = `post_${postId}_statistics_${formattedDate}.pdf`;


  const dropboxLink = await this.dropboxService.uploadBuffer(pdfBuffer, filename);
  await this.savePostPdfUrlToDatabase(postId, dropboxLink);

  return dropboxLink;
}


  private async savePdfUrlToDatabase(userId: number, url: string): Promise<void> {
    try {
      await this.prisma.statisticsPdfUrl.create({
        data: { userId, url },
      });
    } catch (error) {
      throw new Error('Failed to save PDF URL to database: ' + error.message);
    }
  }

  private async savePostPdfUrlToDatabase(postId: number, url: string): Promise<void> {
    try {
      await this.prisma.postStatisticsPdfUrl.create({
        data: { postId, url },
      });
    } catch (error) {
      throw new Error('Failed to save Post PDF URL to database: ' + error.message);
    }
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

}

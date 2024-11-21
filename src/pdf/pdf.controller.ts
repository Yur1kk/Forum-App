import { Controller, Post, Query, Body, Res, HttpStatus, Req, UseGuards, Get } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { PostsService } from 'src/posts/posts.service';

@Controller('pdf')
export class PdfController {
  constructor(
    private pdfService: PdfService,
    private postsService: PostsService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
async generatePdf(
  @Req() req,
  @Body() body: any,
  @Res() res: Response,
  @Query('postId') postId: string | null,
  @Query('targetUserId') targetUserId: string | null,
) {
  const userId = req.user.sub;
  const roleId = req.user.roleId;
  const isAdmin = roleId === 2;
  const parsedPostId = postId ? parseInt(postId, 10) : null;
  const parsedTargetUserId = targetUserId ? parseInt(targetUserId, 10) : null;

  if (parsedPostId) {
    const post = await this.postsService.findPostById(parsedPostId);
    if (!post) {
      return res.status(HttpStatus.NOT_FOUND).json({ message: 'Post not found.' });
    }

    if (!isAdmin && post.authorId !== userId) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Access denied.' });
    }

    try {
      const filePath = await this.pdfService.generatePostPdfReport(
        parsedPostId,
        body.startDate,
        body.endDate,
        body.interval,
        isAdmin,
      );
      return res.status(HttpStatus.OK).json({ message: 'PDF generated successfully', filePath });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error generating PDF', error: error.message });
    }
  } else {

    if (parsedTargetUserId) {
      if (!isAdmin) {
        return res.status(HttpStatus.FORBIDDEN).json({ message: 'Access denied. Only admins can generate statistics for other users.' });
      }

      try {
        const filePath = await this.pdfService.generateUserPdfReport(
          parsedTargetUserId,
          body.startDate,
          body.endDate,
          body.interval,
          isAdmin,
        );
        return res.status(HttpStatus.OK).json({ message: 'PDF generated successfully', filePath });
      } catch (error) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error generating PDF', error: error.message });
      }
    } else {
      try {
        const filePath = await this.pdfService.generateUserPdfReport(
          userId,
          body.startDate,
          body.endDate,
          body.interval,
          isAdmin,
        );
        return res.status(HttpStatus.OK).json({ message: 'PDF generated successfully', filePath });
      } catch (error) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error generating PDF', error: error.message });
      }
    }
  }
}


  @UseGuards(JwtAuthGuard)
  @Get('download')
  async downloadPdf(@Req() req, @Res() res: Response, @Query('postId') postId: string | null, @Query('targetUserId') targetUserId: string | null) {
    const userId = req.user.sub;
    const roleId = req.user.roleId;
    const isAdmin = roleId === 2;
    const parsedPostId = postId ? parseInt(postId, 10) : null;
    const parsedTargetUserId = targetUserId ? parseInt(targetUserId, 10) : null;

    if (parsedPostId) {
      const post = await this.postsService.findPostById(parsedPostId);
      if (!post) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'Post not found.' });
      }

      if (!isAdmin && post.authorId !== userId) {
        return res.status(HttpStatus.FORBIDDEN).json({ message: 'Access denied.' });
      }

      try {
        const fileUrl = await this.pdfService.getPdfUrl(null, parsedPostId);
        return res.status(HttpStatus.OK).json({ message: 'PDF ready for download', fileUrl });
      } catch (error) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error retrieving PDF URL', error: error.message });
      }
    } else {
      if (parsedTargetUserId) {
        if (!isAdmin) {
          return res.status(HttpStatus.FORBIDDEN).json({ message: 'Access denied. Only admins can download other users\' statistics.' });
        }

        try {
          const fileUrl = await this.pdfService.getPdfUrl(parsedTargetUserId, null);
          return res.status(HttpStatus.OK).json({ message: 'PDF ready for download', fileUrl });
        } catch (error) {
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error retrieving PDF URL', error: error.message });
        }
      } else {
        try {
          const fileUrl = await this.pdfService.getPdfUrl(userId, null);
          return res.status(HttpStatus.OK).json({ message: 'PDF ready for download', fileUrl });
        } catch (error) {
          return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error retrieving PDF URL', error: error.message });
        }
      }
    }
  }
}

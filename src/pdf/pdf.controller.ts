import { Controller, Post, Query, Body, Res, HttpStatus, Req, UseGuards, Get } from '@nestjs/common';
import { Response } from 'express';
import { PdfService } from './pdf.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';

@Controller('pdf')
export class PdfController {
  constructor(private pdfService: PdfService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generatePdf(
    @Req() req,
    @Body() body: any,
    @Res() res: Response,
    @Query('targetUserId') targetUserId?: string, 
  ) {
    const userId = req.user.sub;
    const roleId = req.user.roleId;
    const isAdmin = roleId === 2;

    const targetUserIdInt = targetUserId ? parseInt(targetUserId, 10) : undefined;

    if (!isAdmin && targetUserIdInt && targetUserIdInt !== userId) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Access denied.' });
    }

    const id = targetUserIdInt || userId;

    try {
      const filePath = await this.pdfService.generatePdfReport(
        id,
        body.startDate,
        body.endDate,
        body.interval,
        isAdmin
      );

      return res.status(HttpStatus.OK).json({ message: 'PDF generated', filePath });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error generating PDF', error: error.message });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('download')
  async downloadPdf(
    @Req() req,
    @Res() res: Response,
    @Query('targetUserId') targetUserId?: number,
  ) {
    const userId = req.user.sub;
    const roleId = req.user.roleId;
    const isAdmin = roleId === 2;

    if (!isAdmin && targetUserId && targetUserId !== userId) {
      return res.status(HttpStatus.FORBIDDEN).json({ message: 'Access denied.' });
    }

    const id = targetUserId || userId;
    try {
      const filePath = await this.pdfService.getPdfUrl(id);
      return res.redirect(filePath);
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: 'Error retrieving PDF URL', error: error.message });
    }
  }
}

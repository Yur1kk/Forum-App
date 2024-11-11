import { Controller, Post, Param, Body, Delete, UseGuards, Get, Request, Query } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post(':id/comment')
  async commentPost(@Param('id') postId:string, @Request() req, @Body('content') content: string) {
    const userId = req.user.sub;
    const postIdInt = parseInt(postId, 10);
    return this.commentsService.commentPost(userId, postIdInt, content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':postId/comment/:commentId')
  async deleteComment(@Param('postId') postId:string, @Param('commentId') commentId: string, @Request() req) {
      const userId = req.user.sub;
      const postIdInt = parseInt(postId, 10);
      const commentIdInt = parseInt(commentId, 10);
      return this.commentsService.deleteComment(userId, postIdInt, commentIdInt);
  }
  

  @UseGuards(JwtAuthGuard)
  @Get(':id/comments')
  async getAllComments(@Param('id') postId: string, @Request() req, @Query('page') page: string = '1', @Query('limit') limit: string = '10'){
   const userId = req.user.sub;
   const postIdInt = parseInt(postId, 10);
   const pageNumber = parseInt(page, 10);
   const limitNumber = parseInt(limit, 10);
   const comments = await this.commentsService.getAllComments(userId, postIdInt, pageNumber, limitNumber)
   return {comments};
  }
}

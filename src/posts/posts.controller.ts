import { Controller, Post, Body, UseGuards, Request, Delete, Param, Patch, Get, Query, NotFoundException} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { UpdatePostDto } from './dto/update-post.dto';
import { UserService } from 'src/user/user.service';

@Controller('posts')
export class PostsController {
   constructor(private postsService: PostsService, private userService: UserService) {}

   @UseGuards(JwtAuthGuard)
   @Post('create-post')
   async createPost(@Body() createPostDto: CreatePostDto, @Request() req) {
       console.log('Creating post with data:', createPostDto);
       const userId = req.user.sub;
       return this.postsService.createPost(userId, createPostDto);
   }
   
   @UseGuards(JwtAuthGuard)
   @Delete(':id')
   async deletePost(@Param('id') postId: string, @Request() req) {
    const userId = req.user.sub;
    const postIdInt = parseInt(postId, 10);
    return this.postsService.deletePost(userId, postIdInt);
}
   @UseGuards(JwtAuthGuard)
   @Patch(':id')
   async updatePost(@Body() updatePostDto: UpdatePostDto, @Param('id') postId: string, @Request() req) {
    const userId = req.user.sub;
    const postIdInt = parseInt(postId, 10);
    return this.postsService.updatePost(userId, postIdInt, updatePostDto);
   }

   @UseGuards(JwtAuthGuard)
   @Get()
   async getAllPosts(@Request() req, @Query('page') page: string = '1', @Query('limit') limit: string = '10') {
    const userId = req.user.sub;
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.postsService.getAllPosts(userId, pageNumber, limitNumber);
   }

   @UseGuards(JwtAuthGuard)
   @Post(':id/like')
   async toggleLikePost(@Param('id') postId:string, @Request() req) {
     const userId = req.user.sub;
     const postIdInt = parseInt(postId, 10);
     return this.postsService.toggleLikePost(userId, postIdInt);
   }

   @UseGuards(JwtAuthGuard)
   @Post(':id/comment')
   async commentPost(@Param('id') postId:string, @Request() req, @Body('content') content: string) {
     const userId = req.user.sub;
     const postIdInt = parseInt(postId, 10);
     return this.postsService.commentPost(userId, postIdInt, content);
   }

   @UseGuards(JwtAuthGuard)
   @Delete(':postId/comment/:commentId')
   async deleteComment(@Param('postId') postId:string, @Param('commentId') commentId: string, @Request() req) {
       const userId = req.user.sub;
       const postIdInt = parseInt(postId, 10);
       const commentIdInt = parseInt(commentId, 10);
       return this.postsService.deleteComment(userId, postIdInt, commentIdInt);
   }
   

   @UseGuards(JwtAuthGuard)
   @Get(':id/comments')
   async getAllComments(@Param('id') postId: string, @Request() req, @Query('page') page: string = '1', @Query('limit') limit: string = '10'){
    const userId = req.user.sub;
    const postIdInt = parseInt(postId, 10);
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const comments = await this.postsService.getAllComments(userId, postIdInt, pageNumber, limitNumber)
    return {comments};
   }

   @UseGuards(JwtAuthGuard)
   @Patch(':id/archive')
   async archivePost(@Param('id') postId: string, @Request() req) {
       const userId = req.user.sub;
       const postIdInt = parseInt(postId, 10);
       return this.postsService.archivePost(userId, postIdInt);
   }

   @UseGuards(JwtAuthGuard)
   @Patch(':id/unarchive')
   async unarchivePost(@Param('id') postId: string, @Request() req) {
       const userId = req.user.sub;
       const postIdInt = parseInt(postId, 10);
       return this.postsService.unarchivePost(userId, postIdInt);
   }

   @Get('archived')
   @UseGuards(JwtAuthGuard)
   async getArchivedPosts(@Request() req, @Query('targetUserId') targetUserId?: string, @Query('page') page: string = '1', @Query('limit') limit: string = '10') {
     const userId = req.user.sub;
     const userIdInt = typeof userId === 'string' ? parseInt(userId, 10) : userId;
     const targetUserIdInt = targetUserId ? parseInt(targetUserId, 10) : undefined;
     const pageNumber = parseInt(page, 10);
     const limitNumber = parseInt(limit, 10);
     return this.postsService.getArchivedPostsByUser(userIdInt, targetUserIdInt, pageNumber, limitNumber);
   }

  @UseGuards(JwtAuthGuard) 
  @Get('filter')
  async filterPosts(
    @Request() req,
    @Query('categoryId') categoryId?: number,
    @Query('searchPhrase') searchPhrase?: string,
    @Query('page') page: string = '1', @Query('limit') limit: string = '10',
    @Query('orderBy') orderBy: 'asc' | 'desc' = 'desc'
  ) {
    const userId = req.user.sub; 

    const filters = {
      categoryId: categoryId ? Number(categoryId) : undefined,
      searchPhrase: searchPhrase ? String(searchPhrase) : undefined,
    };
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.postsService.filterPosts(userId, filters, pageNumber, limitNumber, orderBy);
  }
}
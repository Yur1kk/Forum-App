import { Controller, Post, Body, UseGuards, Request, Delete, Param, Patch, Get, Query, BadRequestException, ParseIntPipe} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { JwtAuthGuard } from '../auth/strategies/jwt-auth.guard';
import { UpdatePostDto } from './dto/update-post.dto';


@Controller('posts')
export class PostsController {
   constructor(private postsService: PostsService) {}

   @UseGuards(JwtAuthGuard)
   @Post('create-post')
   async createPost(@Body() createPostDto: CreatePostDto, @Request() req) {
       console.log('Creating post with data:', createPostDto);
       const userId = req.user.sub;
       return this.postsService.createPost(userId, createPostDto);
   }

   @UseGuards(JwtAuthGuard)
   @Get(':id')
   async getPost( @Param('id', ParseIntPipe) postId: number,
   @Request() req){
    const userId = req.user.sub;
    return this.postsService.getPost(userId, postId);
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
   async getAllPosts(
     @Request() req, 
     @Query('userId') userId: string | undefined, 
     @Query('page') page: string = '1', 
     @Query('limit') limit: string = '10'
   ) {
       const currentUserId = req.user.sub;
       const pageNumber = parseInt(page, 10);
       const limitNumber = parseInt(limit, 10);
   
       const targetUserId = userId ? parseInt(userId, 10) : undefined;
   
       if (isNaN(targetUserId)) {
           return this.postsService.getAllPosts(currentUserId, undefined, pageNumber, limitNumber);
       }
   
       return this.postsService.getAllPosts(currentUserId, targetUserId, pageNumber, limitNumber);
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
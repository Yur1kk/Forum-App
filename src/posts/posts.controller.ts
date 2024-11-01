import { Controller, Post, Body, UseGuards, Request, Delete, Param, Patch, Get} from '@nestjs/common';
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
   async getAllPosts(@Request() req) {
    const userId = req.user.sub; 
        return this.postsService.getAllPosts(userId);
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
   async getAllComments(@Param('id') postId: string, @Request() req){
    const userId = req.user.sub;
    const postIdInt = parseInt(postId, 10);
    const comments = await this.postsService.getAllComments(userId, postIdInt)
    return {comments};
   }
}
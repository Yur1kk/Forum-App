import { Injectable, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";
import {User, Post} from '@prisma/client'

@Injectable()
export class ViewService {
    constructor(private prisma: PrismaService) {}
    async countView(user: User, post: Post): Promise<number> {
        const isAdmin = user.roleId === 2;
        const isAuthor = post.authorId === user.id;
        const isArchived = !post.published;
    
       
        if (isArchived && !isAuthor && !isAdmin) {
          throw new ForbiddenException('You do not have permission to view this post');
        }
    
        
        if ((isAdmin || !isAuthor) && !isArchived) {
          const existingView = await this.prisma.view.findFirst({
            where: {
              postId: post.id,
              userId: user.id,
            },
          });
    
          
          if (!existingView) {
            await this.prisma.view.create({
              data: {
                postId: post.id,
                userId: user.id,
              },
            });
          }
        }
    
        
        return this.prisma.view.count({
          where: { postId: post.id },
        });
      }
}
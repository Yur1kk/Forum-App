import { Injectable } from "@nestjs/common";
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoggerService {
    constructor(private prisma: PrismaService) {}
    

    async logActions (userId: number,
         action: 'Create' | 'Update' | 'Delete' | 'Viewed',
          entityType: 'Post' | 'Comment' | 'PostLike',
          entityId: number,
          entity: object
        ) {
            await this.prisma.userActionLog.create({
                data: {
                    action,
                    userId,
                    entityType,
                    entityId,
                    entity: JSON.stringify(entity),
                },
            });
    }

}
import { Injectable } from "@nestjs/common";
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserActionLogDto } from "./dto/logger.dto";

@Injectable()
export class LoggerService {
    constructor(private prisma: PrismaService) {}
    

    async logActions (createUserActionLogDto: CreateUserActionLogDto
        ) {
            await this.prisma.userActionLog.create({
                data: {
                    ...createUserActionLogDto
                },
            });
    }
    
    async logAction(action: string, userId: number, entityType: string, entityId: number, entity: any) {
        const logDto = new CreateUserActionLogDto();
        logDto.action = action;
        logDto.userId = userId;
        logDto.entityType = entityType;
        logDto.entityId = entityId;
        logDto.entity = JSON.stringify(entity);
    
        await this.logActions(logDto);
}
}
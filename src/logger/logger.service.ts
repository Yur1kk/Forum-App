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

}
import { Module } from '@nestjs/common';
import { ViewService } from './views.service'; 
import { PrismaService } from 'prisma/prisma.service'; 
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      })],
  providers: [ViewService, PrismaService ],
  exports: [ViewService],  
})
export class ViewModule {}

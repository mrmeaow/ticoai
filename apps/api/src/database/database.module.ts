import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../modules/users/entities/user.entity';
import { Role } from '../modules/roles/entities/role.entity';
import { Permission } from '../modules/roles/entities/permission.entity';
import { RolePermission } from '../modules/roles/entities/role-permission.entity';
import { Ticket } from '../modules/tickets/entities/ticket.entity';
import { Message } from '../modules/messages/entities/message.entity';
import { AiResult } from '../modules/ai/entities/ai-result.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Always read from environment variables directly for test compatibility
        const nodeEnv =
          process.env.NODE_ENV ||
          configService.get<string>('app.nodeEnv') ||
          'development';
        const isTest = nodeEnv === 'test';

        return {
          type: 'postgres',
          host:
            process.env.DB_HOST ||
            configService.get<string>('database.host') ||
            'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username:
            process.env.DB_USERNAME ||
            configService.get<string>('database.username') ||
            'ticoai',
          password:
            process.env.DB_PASSWORD ||
            configService.get<string>('database.password') ||
            'ticoai_secret',
          database:
            process.env.DB_DATABASE ||
            configService.get<string>('database.database') ||
            'ticoai',
          entities: [
            User,
            Role,
            Permission,
            RolePermission,
            Ticket,
            Message,
            AiResult,
          ],
          migrations: [__dirname + '/../../database/migrations/*{.ts,.js}'],
          synchronize: isTest,
          autoLoadEntities: isTest,
          logging: nodeEnv === 'development',
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

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
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host', 'localhost'),
        port: configService.get<number>('database.port', 5432),
        username: configService.get<string>('database.username', 'ticoai'),
        password: configService.get<string>('database.password', 'ticoai_secret'),
        database: configService.get<string>('database.database', 'ticoai'),
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
        synchronize: false,
        autoLoadEntities: true,
        logging: configService.get<string>('app.nodeEnv') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}

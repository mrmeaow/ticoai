import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Message } from '../../messages/entities/message.entity';
import { AiResult } from '../../ai/entities/ai-result.entity';
import { TicketStatus, TicketPriority } from '@pkg/types';
import { ApiProperty, ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

@Entity('tickets')
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Ticket unique identifier',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column()
  @ApiProperty({
    description: 'Ticket title (brief summary)',
    example: 'Unable to login to customer portal',
    minLength: 1,
    maxLength: 200,
  })
  title: string;

  @Column('text')
  @ApiProperty({
    description: 'Detailed description of the issue',
    example: 'Customer reports being unable to access the dashboard after successful login. Error message appears: "Session expired".',
  })
  description: string;

  @Column({
    type: 'enum',
    enum: TicketStatus,
    default: TicketStatus.OPEN,
  })
  @ApiProperty({
    description: 'Current ticket status',
    enum: TicketStatus,
    example: TicketStatus.OPEN,
  })
  status: TicketStatus;

  @Column({
    type: 'enum',
    enum: TicketPriority,
    default: TicketPriority.MEDIUM,
  })
  @ApiProperty({
    description: 'Ticket priority level',
    enum: TicketPriority,
    example: TicketPriority.HIGH,
  })
  priority: TicketPriority;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'assigneeId' })
  @ApiPropertyOptional({
    description: 'Assigned agent/admin user',
    type: () => User,
  })
  assignee?: User;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'createdById' })
  @ApiProperty({
    description: 'User who created the ticket',
    type: () => User,
  })
  createdBy: User;

  @OneToMany(() => Message, (message) => message.ticket, { cascade: true })
  @ApiHideProperty()
  @Exclude()
  messages: Message[];

  @OneToMany(() => AiResult, (aiResult) => aiResult.ticket, { cascade: true })
  @ApiHideProperty()
  @Exclude()
  aiResults: AiResult[];

  @CreateDateColumn()
  @ApiProperty({
    description: 'Ticket creation timestamp',
    format: 'date-time',
  })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({
    description: 'Last update timestamp',
    format: 'date-time',
  })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiHideProperty()
  @Exclude()
  deletedAt: Date | null;
}

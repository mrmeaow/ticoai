import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { User } from '../../users/entities/user.entity';
import { MessageRole } from '@pkg/types';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  @ApiProperty({
    description: 'Message unique identifier',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Column('text')
  @ApiProperty({
    description: 'Message content text',
    example: 'Hello, I need help with my account settings.',
  })
  content: string;

  @Column({
    type: 'enum',
    enum: MessageRole,
  })
  @ApiProperty({
    description: 'Role of the message sender',
    enum: MessageRole,
    example: MessageRole.AGENT,
  })
  role: MessageRole;

  @ManyToOne(() => Ticket, (ticket) => ticket.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticketId' })
  @ApiProperty({
    description: 'Ticket this message belongs to',
    type: () => Ticket,
  })
  ticket: Ticket;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'senderId' })
  @ApiProperty({
    description: 'User who sent the message',
    type: () => User,
  })
  sender: User;

  @Column({ nullable: true })
  @ApiPropertyOptional({
    description: 'AI job ID for async processing',
    example: 'job_abc123',
  })
  aiJobId?: string;

  @CreateDateColumn()
  @ApiProperty({
    description: 'Message creation timestamp',
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
  deletedAt: Date | null;
}

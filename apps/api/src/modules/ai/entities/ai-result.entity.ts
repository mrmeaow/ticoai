import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { AiJobType, AiJobStatus } from '@pkg/types';

@Entity('ai_results')
export class AiResult {
  @ApiProperty({
    description: 'Unique identifier for the AI result',
    format: 'uuid',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({
    description: 'Type of the AI job',
    enum: AiJobType,
    example: AiJobType.SUMMARIZE,
  })
  @Column({
    type: 'enum',
    enum: AiJobType,
  })
  jobType: AiJobType;

  @ApiProperty({
    description: 'Current status of the AI job',
    enum: AiJobStatus,
    example: AiJobStatus.PENDING,
  })
  @Column({
    type: 'enum',
    enum: AiJobStatus,
    default: AiJobStatus.PENDING,
  })
  status: AiJobStatus;

  @ApiPropertyOptional({
    description: 'Result output from the AI job',
    example: 'The ticket has been classified as a billing issue.',
  })
  @Column('text', { nullable: true })
  result: string | null;

  @ApiPropertyOptional({
    description: 'Error message if the AI job failed',
    example: 'Failed to connect to AI service.',
  })
  @Column('text', { nullable: true })
  error: string | null;

  @ApiProperty({
    description: 'Identifier of the associated AI job',
    example: 'job_12345',
  })
  @Column()
  jobId: string;

  @ApiProperty({
    description: 'The ticket associated with this AI result',
    type: () => Ticket,
  })
  @ManyToOne(() => Ticket, (ticket) => ticket.aiResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @ApiProperty({
    description: 'Timestamp when the record was created',
    format: 'date-time',
  })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the record was last updated',
    format: 'date-time',
  })
  @UpdateDateColumn()
  updatedAt: Date;
}

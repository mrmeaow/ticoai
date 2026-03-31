import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Ticket } from '../../tickets/entities/ticket.entity';
import { AiJobType, AiJobStatus } from '@pkg/types';

@Entity('ai_results')
export class AiResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AiJobType,
  })
  jobType: AiJobType;

  @Column({
    type: 'enum',
    enum: AiJobStatus,
    default: AiJobStatus.PENDING,
  })
  status: AiJobStatus;

  @Column('text', { nullable: true })
  result: string | null;

  @Column('text', { nullable: true })
  error: string | null;

  @Column()
  jobId: string;

  @ManyToOne(() => Ticket, (ticket) => ticket.aiResults, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ticketId' })
  ticket: Ticket;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

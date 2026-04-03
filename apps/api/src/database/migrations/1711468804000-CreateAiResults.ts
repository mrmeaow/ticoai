import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAiResults1711468804000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ai_results table
    await queryRunner.createTable(
      new Table({
        name: 'ai_results',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'jobType',
            type: 'enum',
            enum: ['SUMMARIZE', 'DETECT_PRIORITY', 'SUGGEST_REPLY'],
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
            default: "'PENDING'",
          },
          {
            name: 'result',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'jobId',
            type: 'varchar',
          },
          {
            name: 'ticketId',
            type: 'uuid',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_AI_RESULTS_JOB_ID',
            columnNames: ['jobId'],
            isUnique: true,
          }),
          new TableIndex({
            name: 'IDX_AI_RESULTS_TICKET',
            columnNames: ['ticketId'],
          }),
        ],
      }),
      true,
    );

    // Create foreign key for ai_results
    await queryRunner.createForeignKey(
      'ai_results',
      new TableForeignKey({
        name: 'FK_AI_RESULTS_TICKET',
        columnNames: ['ticketId'],
        referencedTableName: 'tickets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('ai_results');
  }
}

import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateTickets1711468802000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create tickets table
    await queryRunner.createTable(
      new Table({
        name: 'tickets',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'title',
            type: 'varchar',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
            default: "'OPEN'",
          },
          {
            name: 'priority',
            type: 'enum',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
            default: "'MEDIUM'",
          },
          {
            name: 'assigneeId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdById',
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
          {
            name: 'deletedAt',
            type: 'timestamp',
            isNullable: true,
          },
        ],
        indices: [
          new TableIndex({
            name: 'IDX_TICKETS_STATUS',
            columnNames: ['status'],
          }),
          new TableIndex({
            name: 'IDX_TICKETS_PRIORITY',
            columnNames: ['priority'],
          }),
          new TableIndex({
            name: 'IDX_TICKETS_ASSIGNEE',
            columnNames: ['assigneeId'],
          }),
        ],
      }),
      true,
    );

    // Create foreign keys for tickets
    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        name: 'FK_TICKETS_ASSIGNEE',
        columnNames: ['assigneeId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );

    await queryRunner.createForeignKey(
      'tickets',
      new TableForeignKey({
        name: 'FK_TICKETS_CREATED_BY',
        columnNames: ['createdById'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('tickets');
  }
}

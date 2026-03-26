import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateMessages1711468803000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create messages table
    await queryRunner.createTable(
      new Table({
        name: 'messages',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'content',
            type: 'text',
          },
          {
            name: 'role',
            type: 'enum',
            enum: ['AGENT', 'CUSTOMER', 'AI'],
          },
          {
            name: 'ticketId',
            type: 'uuid',
          },
          {
            name: 'senderId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'aiJobId',
            type: 'varchar',
            isNullable: true,
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
            name: 'IDX_MESSAGES_TICKET',
            columnNames: ['ticketId'],
          }),
          new TableIndex({
            name: 'IDX_MESSAGES_SENDER',
            columnNames: ['senderId'],
          }),
        ],
      }),
      true,
    );

    // Create foreign keys for messages
    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        name: 'FK_MESSAGES_TICKET',
        columnNames: ['ticketId'],
        referencedTableName: 'tickets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createForeignKey(
      'messages',
      new TableForeignKey({
        name: 'FK_MESSAGES_SENDER',
        columnNames: ['senderId'],
        referencedTableName: 'users',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('messages');
  }
}

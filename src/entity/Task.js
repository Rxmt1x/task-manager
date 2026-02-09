const { EntitySchema } = require('typeorm');

module.exports = new EntitySchema({
  name: 'Task',
  columns: {
    id: {
      primary: true,
      type: 'int',
      generated: 'increment',
    },
    title: {
      type: 'varchar',
    },
    description: {
      type: 'varchar',
      nullable: true,
    },
    status: {
      type: 'varchar',
      default: 'pending',
    },
    priority: {
      type: 'varchar',
      default: 'medium',
    },
    dueDate: {
      type: 'timestamp',
      nullable: true,
    },
    createdAt: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
    },
    updatedAt: {
      type: 'timestamp',
      default: () => 'CURRENT_TIMESTAMP',
      onUpdate: 'CURRENT_TIMESTAMP',
    },
    userId: {
      type: 'int',
    },
  },
  relations: {
    user: {
      type: 'many-to-one',
      target: 'User',
      joinColumn: {
        name: 'userId',
      },
      onDelete: 'CASCADE',
    },
  },
});
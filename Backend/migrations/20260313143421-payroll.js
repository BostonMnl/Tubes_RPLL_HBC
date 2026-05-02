'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('payroll', {
      payroll_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'user_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      bulan: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      tahun: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      gaji_pokok: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      total_insentif: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      total_reimburse: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      total_penalti: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      take_home_pay: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        type: Sequelize.DATE,
        allowNull: true,
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('payroll');
  }
};

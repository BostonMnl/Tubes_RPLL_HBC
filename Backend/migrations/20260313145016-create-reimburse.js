'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('reimburse', {
      reimburse_id:{
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      keterangan:{
        type: Sequelize.STRING,
        allowNull: true
      },
      nominal:{
        type: Sequelize.FLOAT,
        allowNull: false
      },
      gambar:{
        type: Sequelize.STRING,
        allowNull: true
      },
      status:{
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
      },
      tanggal:{
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      payroll_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'payroll',
          key: 'payroll_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      gaji_id:{
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'gaji',
          key: 'gaji_id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
    await queryInterface.dropTable('reimburse');
  }
};

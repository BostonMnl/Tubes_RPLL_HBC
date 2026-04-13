'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('gaji', {
      gaji_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      nominal:{
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      tanggal_berlaku: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      createdAt: {
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
    await queryInterface.dropTable('gaji');
  }
};

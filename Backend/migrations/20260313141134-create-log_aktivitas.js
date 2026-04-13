'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('log_aktivitas', {
      log_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      waktu :{
        type: Sequelize.DATE,
        allowNull: false,
      },
      aktivitas: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'user_id'
        },
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('log_aktivitas');
  }
};

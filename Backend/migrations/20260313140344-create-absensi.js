'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('absensi', {
      absensi_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      date : {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      jam_masuk:{
        type: Sequelize.TIME,
        allowNull: false,
      },
      jam_keluar:{
        type: Sequelize.TIME,
        allowNull: true,
      },
      status:{
        type: Sequelize.ENUM('Hadir', 'Sakit', 'Cuti', 'Alpha'),
        allowNull: false,
      },
      qr_code:{
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
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      }
    });
  },

  async down (queryInterface, Sequelize) {
     await queryInterface.dropTable('absensi');
  }
};

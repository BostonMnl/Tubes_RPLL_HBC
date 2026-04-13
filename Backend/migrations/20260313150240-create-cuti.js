'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('cuti', {
      cuti_id:{
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      keterangan:{
        type: Sequelize.STRING,
        allowNull: false
      },
      tanggal_mulai:{
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      tanggal_akhir:{
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      status:{
        type: Sequelize.ENUM('Pending', 'Approved', 'Rejected'),
        allowNull: false,
        defaultValue: 'Pending'
      },
      disetujui_oleh:{
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        }
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'user_id'
        }
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
    await queryInterface.dropTable('cuti');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
     await queryInterface.createTable('user', { 
      user_id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        unique: true,
        defaultValue: Sequelize.UUIDV4
      },
      nama: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      alamat: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        }, 
      },
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      jabatan: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      manager_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'user',
          key: 'user_id'
        },
      },
      gambar:{
        type: Sequelize.STRING,
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('admin', 'karyawan'),
        allowNull: false,
      },
      departemen: {
        type: Sequelize.STRING,
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
     await queryInterface.dropTable('user');
  }
};

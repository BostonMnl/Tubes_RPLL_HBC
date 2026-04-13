'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('isenstif', {
      insentif_id: {
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
      tanggal: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'user',
          key: 'user_id'
        },
        gaji_id:{
          type: Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'gaji',
            key: 'gaji_id'
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
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('insentif');
  }
};

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'user',
        'jabatan',
        {
          type: Sequelize.ENUM('manager', 'staff', 'supervisor'),
          allowNull: false,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'user',
        'departemen',
        {
          type: Sequelize.ENUM('SALES', 'IT', 'FINANCE', 'PURCHASE'),
          allowNull: false,
        },
        { transaction }
      );
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.changeColumn(
        'user',
        'jabatan',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );

      await queryInterface.changeColumn(
        'user',
        'departemen',
        {
          type: Sequelize.STRING,
          allowNull: false,
        },
        { transaction }
      );
    });
  },
};

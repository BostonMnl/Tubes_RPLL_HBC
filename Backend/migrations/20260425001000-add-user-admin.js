'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {

    const now = new Date();
    const hashedPassword = await bcrypt.hash('Admin1234!Strong', 10);

    await queryInterface.bulkInsert('user', [
      {
        user_id: uuidv4(),
        nama: 'Admin HBC',
        alamat: 'Head Office',
        email: 'admin@hbc.local',
        password: hashedPassword,
        jabatan: 'manager',
        manager_id: null,
        gambar: null,
        role: 'admin',
        departemen: 'IT',
        nomor_telepon: null,
        tanggal_lahir: null,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user', { email: 'admin@hbc.local' });
  },
};
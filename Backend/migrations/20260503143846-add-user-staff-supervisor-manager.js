'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const hashedPassword = await bcrypt.hash('Admin1234!Strong', 10);

    const supervisorId = uuidv4();
    const managerId = uuidv4();
    const staffId = uuidv4();

    await queryInterface.bulkInsert('user', [
      {
        user_id: supervisorId,
        nama: 'Calvin',
        alamat: 'Head Office',
        email: 'if-23040@students.ithb.ac.id',
        password: hashedPassword,
        jabatan: 'supervisor',
        manager_id: null,
        gambar: null,
        role: 'staff',
        departemen: 'IT',
        nomor_telepon: '085101990299',
        tanggal_lahir: new Date('1995-01-01'),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        user_id: managerId,
        nama: 'Boston',
        alamat: 'Head Office',
        email: 'if-23039@students.ithb.ac.id',
        password: hashedPassword,
        jabatan: 'manager',
        manager_id: supervisorId,
        gambar: null,
        role: 'staff',
        departemen: 'IT',
        nomor_telepon: '085103990499',
        tanggal_lahir: new Date('2000-02-02'),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
      {
        user_id: staffId,
        nama: 'Hans',
        alamat: 'Head Office',
        email: 'if-23026@students.ithb.ac.id',
        password: hashedPassword,
        jabatan: 'staff',
        manager_id: managerId,
        gambar: null,
        role: 'staff',
        departemen: 'IT',
        nomor_telepon: '085105990699',
        tanggal_lahir: new Date('2005-03-03'),
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('user', {
      email: ['if-23040@students.ithb.ac.id', 'if-23039@students.ithb.ac.id', 'if-23026@students.ithb.ac.id'],
    });
  },
};

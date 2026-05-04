'use strict';
const { randomUUID } = require('crypto');
const bcrypt = require('bcrypt'); // Ubah ke 'bcryptjs' jika proyekmu menggunakan bcryptjs

const pad = (value) => String(value).padStart(2, '0');
const dateOnly = (year, month, day) => `${year}-${pad(month)}-${pad(day)}`;

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      console.log('Memulai proses bulk insert via migration...');

      // PENTING: Baris ini akan MENGHAPUS SEMUA DATA LAMA. 
      // Hapus atau comment jika ingin mempertahankan data lama.
      await queryInterface.sequelize.query('SET session_replication_role = replica;', { transaction });
      await queryInterface.sequelize.query(
        'TRUNCATE TABLE "reimburse", "insentif", "penalti", "absensi", "payroll", "gaji", "user" RESTART IDENTITY CASCADE;',
        { transaction }
      );
      await queryInterface.sequelize.query('SET session_replication_role = origin;', { transaction });
      console.log('Tabel berhasil dibersihkan.');

      // Persiapan Waktu & Enkripsi
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
      const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;

      const currentCutoffStart = dateOnly(previousYear, previousMonth, 26);
      const currentCutoffEnd = dateOnly(currentYear, currentMonth, 25);
      const boundaryIncluded = dateOnly(currentYear, currentMonth, 25);
      const boundaryExcluded = dateOnly(currentYear, currentMonth, 26);
      const previousCutoffStart = dateOnly(previousYear, previousMonth, 26);

      const defaultPassword = await bcrypt.hash('12321', 10);

      // Pre-generate UUIDs untuk merangkai relasi (Foreign Keys)
      const adminId = randomUUID();
      const managerId = randomUUID();
      const supervisorId = randomUUID();
      const staffCalcId = randomUUID();
      const staffExistingId = randomUUID();
      const staffZeroId = randomUUID();
      const staffNoId = randomUUID();
      const staffNegativeId = randomUUID();
      const inactiveId = randomUUID();
      const staffSupervisorId = randomUUID();

      const oldPayrollId = randomUUID();
      const currentPayrollId = randomUUID();

      // 1. INSERT USERS
      // Catatan: Pastikan nama tabel pertama argumen ini ('user') sesuai dengan nama tabel aslimu di DB (bisa 'Users' atau 'users').
      await queryInterface.bulkInsert('user', [
        { user_id: adminId, nama: 'Admin Staff Combo', alamat: 'Jalan Admin 1', email: 'admin.staff@example.com', password: defaultPassword, jabatan: 'staff', role: 'admin', departemen: 'IT', manager_id: null, createdAt: now, updatedAt: now },
        { user_id: managerId, nama: 'Manager Finance', alamat: 'Jalan Manager 1', email: 'manager.finance@example.com', password: defaultPassword, jabatan: 'manager', role: 'staff', departemen: 'FINANCE', manager_id: null, createdAt: now, updatedAt: now },
        { user_id: supervisorId, nama: 'Supervisor Sales', alamat: 'Jalan Supervisor 1', email: 'supervisor.sales@example.com', password: defaultPassword, jabatan: 'supervisor', role: 'staff', departemen: 'SALES', manager_id: null, createdAt: now, updatedAt: now },
        { user_id: staffCalcId, nama: 'Staff Payroll Test', alamat: 'Jalan Staff 1', email: 'staff.payroll@example.com', password: defaultPassword, jabatan: 'staff', role: 'staff', departemen: 'IT', manager_id: managerId, createdAt: now, updatedAt: now },
        { user_id: staffExistingId, nama: 'Staff Existing Payroll', alamat: 'Jalan Staff 2', email: 'staff.existing@example.com', password: defaultPassword, jabatan: 'staff', role: 'staff', departemen: 'FINANCE', manager_id: managerId, createdAt: now, updatedAt: now },
        { user_id: staffZeroId, nama: 'Staff Zero Salary', alamat: 'Jalan Staff 3', email: 'staff.zero@example.com', password: defaultPassword, jabatan: 'staff', role: 'staff', departemen: 'PURCHASE', manager_id: managerId, createdAt: now, updatedAt: now },
        { user_id: staffNoId, nama: 'Staff No Salary', alamat: 'Jalan Staff 4', email: 'staff.no@example.com', password: defaultPassword, jabatan: 'staff', role: 'staff', departemen: 'SALES', manager_id: null, createdAt: now, updatedAt: now },
        { user_id: staffNegativeId, nama: 'Staff Negative THP', alamat: 'Jalan Staff 5', email: 'staff.negative@example.com', password: defaultPassword, jabatan: 'staff', role: 'staff', departemen: 'IT', manager_id: managerId, createdAt: now, updatedAt: now },
        // Simulasi Inactive User: Kita isi kolom deletedAt (Soft Delete)
        { user_id: inactiveId, nama: 'Inactive Staff', alamat: 'Jalan Inactive 1', email: 'inactive@example.com', password: defaultPassword, jabatan: 'staff', role: 'staff', departemen: 'FINANCE', manager_id: null, createdAt: now, updatedAt: now, deletedAt: now },
        { user_id: staffSupervisorId, nama: 'Staff Supervisor Combo', alamat: 'Jalan Weird 1', email: 'staff.spv@example.com', password: defaultPassword, jabatan: 'supervisor', role: 'staff', departemen: 'IT', manager_id: null, createdAt: now, updatedAt: now },
      ], { transaction });

      // 2. INSERT GAJI
      await queryInterface.bulkInsert('gaji', [
        { gaji_id: randomUUID(), user_id: staffCalcId, nominal: 4500000, tanggal_berlaku: dateOnly(previousYear, previousMonth, 1), createdAt: now, updatedAt: now },
        { gaji_id: randomUUID(), user_id: staffCalcId, nominal: 5000000, tanggal_berlaku: dateOnly(currentYear, currentMonth, 1), createdAt: now, updatedAt: now },
        { gaji_id: randomUUID(), user_id: staffExistingId, nominal: 1500000, tanggal_berlaku: dateOnly(currentYear, currentMonth, 2), createdAt: now, updatedAt: now },
        { gaji_id: randomUUID(), user_id: staffZeroId, nominal: 0, tanggal_berlaku: dateOnly(currentYear, currentMonth, 3), createdAt: now, updatedAt: now },
        { gaji_id: randomUUID(), user_id: supervisorId, nominal: 7000000, tanggal_berlaku: dateOnly(currentYear, currentMonth, 4), createdAt: now, updatedAt: now },
        { gaji_id: randomUUID(), user_id: adminId, nominal: 9500000, tanggal_berlaku: dateOnly(currentYear, currentMonth, 5), createdAt: now, updatedAt: now },
        { gaji_id: randomUUID(), user_id: inactiveId, nominal: 6000000, tanggal_berlaku: dateOnly(currentYear, currentMonth, 6), createdAt: now, updatedAt: now },
        { gaji_id: randomUUID(), user_id: staffNegativeId, nominal: 1000000, tanggal_berlaku: dateOnly(currentYear, currentMonth, 7), createdAt: now, updatedAt: now },
        { gaji_id: randomUUID(), user_id: staffSupervisorId, nominal: 4500000, tanggal_berlaku: dateOnly(currentYear, currentMonth, 8), createdAt: now, updatedAt: now },
      ], { transaction });

      // 3. INSERT PAYROLL
      await queryInterface.bulkInsert('payroll', [
        { payroll_id: currentPayrollId, user_id: staffExistingId, bulan: currentMonth, tahun: currentYear, gaji_pokok: 1500000, total_insentif: 50000, total_reimburse: 100000, total_penalti: 20000, take_home_pay: 1400000, createdAt: now, updatedAt: now },
        { payroll_id: oldPayrollId, user_id: staffCalcId, bulan: previousMonth, tahun: previousYear, gaji_pokok: 4500000, total_insentif: 100000, total_reimburse: 50000, total_penalti: 30000, take_home_pay: 4620000, createdAt: now, updatedAt: now },
      ], { transaction });

      // 4. INSERT INSENTIF
      await queryInterface.bulkInsert('insentif', [
        { insentif_id: randomUUID(), user_id: staffCalcId, nominal: 200000, keterangan: 'Performance bonus', tanggal: dateOnly(currentYear, currentMonth, 4), payroll_id: null, createdAt: now, updatedAt: now },
        { insentif_id: randomUUID(), user_id: staffCalcId, nominal: 0, keterangan: 'Token appreciation', tanggal: dateOnly(currentYear, currentMonth, 10), payroll_id: null, createdAt: now, updatedAt: now },
        { insentif_id: randomUUID(), user_id: staffCalcId, nominal: 500000, keterangan: 'Locked old incentive', tanggal: dateOnly(previousYear, previousMonth, 20), payroll_id: oldPayrollId, createdAt: now, updatedAt: now },
        { insentif_id: randomUUID(), user_id: staffNegativeId, nominal: 100000, keterangan: 'Low bonus', tanggal: dateOnly(currentYear, currentMonth, 10), payroll_id: null, createdAt: now, updatedAt: now },
        { insentif_id: randomUUID(), user_id: inactiveId, nominal: 150000, keterangan: 'Inactive bonus', tanggal: dateOnly(currentYear, currentMonth, 12), payroll_id: null, createdAt: now, updatedAt: now },
      ], { transaction });

      // 5. INSERT REIMBURSE
      await queryInterface.bulkInsert('reimburse', [
        { reimburse_id: randomUUID(), user_id: staffCalcId, nominal: 100000, keterangan: 'Approved transport', tanggal: dateOnly(currentYear, currentMonth, 6), status: 'Approved', payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
        { reimburse_id: randomUUID(), user_id: staffCalcId, nominal: 500000, keterangan: 'Pending hotel', tanggal: dateOnly(currentYear, currentMonth, 7), status: 'Pending', payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
        { reimburse_id: randomUUID(), user_id: staffCalcId, nominal: 250000, keterangan: 'Rejected meal', tanggal: dateOnly(currentYear, currentMonth, 8), status: 'Rejected', payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
        { reimburse_id: randomUUID(), user_id: staffCalcId, nominal: 300000, keterangan: 'Locked reimburse', tanggal: dateOnly(previousYear, previousMonth, 15), status: 'Approved', payroll_id: oldPayrollId, gambar: null, createdAt: now, updatedAt: now },
        { reimburse_id: randomUUID(), user_id: inactiveId, nominal: 200000, keterangan: 'Inactive reimburse', tanggal: dateOnly(currentYear, currentMonth, 13), status: 'Approved', payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
      ], { transaction });

      // 6. INSERT PENALTI
      await queryInterface.bulkInsert('penalti', [
        { penalti_id: randomUUID(), user_id: staffCalcId, jenis: 'Cuti Tidak Berbayar', keterangan: 'Unpaid leave boundary included', nominal: 0, tanggal: dateOnly(currentYear, currentMonth, 3), payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
        { penalti_id: randomUUID(), user_id: staffCalcId, jenis: 'Telat Masuk', keterangan: 'Late arrival on cutoff end', nominal: 20000, tanggal: boundaryIncluded, payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
        { penalti_id: randomUUID(), user_id: staffCalcId, jenis: 'Telat Masuk', keterangan: 'Late arrival outside cutoff', nominal: 30000, tanggal: boundaryExcluded, payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
        { penalti_id: randomUUID(), user_id: staffCalcId, jenis: 'Cuti Tidak Berbayar', keterangan: 'Previous cutoff start penalty', nominal: 0, tanggal: previousCutoffStart, payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
        { penalti_id: randomUUID(), user_id: staffCalcId, jenis: 'Mengrusak', keterangan: 'Locked old penalty', nominal: 50000, tanggal: dateOnly(previousYear, previousMonth, 12), payroll_id: oldPayrollId, gambar: null, createdAt: now, updatedAt: now },
        { penalti_id: randomUUID(), user_id: staffNegativeId, jenis: 'Telat Masuk', keterangan: 'Excessive penalty to force negative THP', nominal: 2500000, tanggal: dateOnly(currentYear, currentMonth, 12), payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
        { penalti_id: randomUUID(), user_id: inactiveId, jenis: 'Telat Masuk', keterangan: 'Inactive penalty open', nominal: 40000, tanggal: dateOnly(currentYear, currentMonth, 16), payroll_id: null, gambar: null, createdAt: now, updatedAt: now },
      ], { transaction });

      // 7. INSERT ABSENSI
      const absensiData = [];
      for (let i = 0; i < 18; i++) {
        const date = new Date(previousYear, previousMonth - 1, 26 + i);
        absensiData.push({
          absensi_id: randomUUID(),
          user_id: staffCalcId,
          date: dateOnly(date.getFullYear(), date.getMonth() + 1, date.getDate()),
          jam_masuk: '08:00:00',
          jam_keluar: '17:00:00',
          status: 'Hadir',
          qr_code: `QR-${staffCalcId}-${i}`,
          createdAt: now,
          updatedAt: now,
        });
      }

      absensiData.push(
        { absensi_id: randomUUID(), user_id: inactiveId, date: dateOnly(currentYear, currentMonth, 12), jam_masuk: '09:30:00', jam_keluar: '13:00:00', status: 'Cuti', qr_code: `QR-${inactiveId}-1`, createdAt: now, updatedAt: now },
        { absensi_id: randomUUID(), user_id: inactiveId, date: dateOnly(currentYear, currentMonth, 13), jam_masuk: '09:30:00', jam_keluar: '13:00:00', status: 'Cuti', qr_code: `QR-${inactiveId}-2`, createdAt: now, updatedAt: now }
      );

      await queryInterface.bulkInsert('absensi', absensiData, { transaction });

      await transaction.commit();
      console.log('Seeding selesai! Seluruh edge cases dan testing data berhasil dimasukkan.');

    } catch (error) {
      await transaction.rollback();
      console.error('Seeding gagal, melakukan rollback. Error:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Kosongkan tabel jika di-rollback
    await queryInterface.sequelize.query('SET session_replication_role = replica;');
    await queryInterface.sequelize.query('TRUNCATE TABLE "reimburse", "insentif", "penalti", "absensi", "payroll", "gaji", "user" CASCADE;');
    await queryInterface.sequelize.query('SET session_replication_role = origin;');
  }
};
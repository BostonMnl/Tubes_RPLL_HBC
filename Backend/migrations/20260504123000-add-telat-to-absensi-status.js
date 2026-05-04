'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(
      "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_absensi_status' AND e.enumlabel = 'Telat') THEN ALTER TYPE \"enum_absensi_status\" ADD VALUE 'Telat'; END IF; END $$;"
    );
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.sequelize.query(
      "DO $$ BEGIN IF EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'enum_absensi_status' AND e.enumlabel = 'Telat') THEN CREATE TYPE \"enum_absensi_status__old\" AS ENUM ('Hadir', 'Sakit', 'Cuti', 'Alpha'); ALTER TABLE \"absensi\" ALTER COLUMN \"status\" TYPE \"enum_absensi_status__old\" USING \"status\"::text::\"enum_absensi_status__old\"; DROP TYPE \"enum_absensi_status\"; ALTER TYPE \"enum_absensi_status__old\" RENAME TO \"enum_absensi_status\"; END IF; END $$;"
    );
  },
};

import dotenv from 'dotenv';
dotenv.config();

import { Sequelize } from 'sequelize-typescript';
import { User } from '../models/user';
import { Absensi } from '../models/absensi';
import { AbsensiStart } from '../models/absensi_start';
import { Cuti } from '../models/cuti';
import { Gaji } from '../models/gaji';
import { Insentif } from '../models/insentif';
import { Payroll } from '../models/payroll';
import { Penalti } from '../models/penalti';
import { Reimburse } from '../models/reimburse';

const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  models: [User, Absensi, AbsensiStart, Cuti, Gaji, Insentif, Payroll, Penalti, Reimburse],
  logging: false,
  define: {
    timestamps: true
  }
});

export default sequelize;
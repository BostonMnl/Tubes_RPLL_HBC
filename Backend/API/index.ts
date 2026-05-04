import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import sequelize from '../config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminUserManageRoutes from './routes/admin.userManage.routes';
import managerialRoutes from './routes/managerial.routes';
import reimburseRoutes from './routes/reimburse.routes';
import cutiRoutes from './routes/cuti.routes';
import gajiRoutes from './routes/gaji.routes';
import insentifRoutes from './routes/insentif.routes';
import penaltiRoutes from './routes/pinalti.routes';
import payrollRoutes from './routes/payroll.routes';
import attendanceRoutes from './routes/attendance.routes';
import adminAttendanceManageRoutes from './routes/admin.attendanceManage.routes';
import { apiErrorHandler } from './middlewares/response.middleware';
import schedulePayrollJob from './src/cron.job';
const app = express();  

// Middleware
app.use(cors());
app.use(express.json());
// app.use(sessionMiddleware);
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/', userRoutes);
app.use('/api/admin', adminUserManageRoutes);
// app.use('/api/admin/attendance', adminAttendanceManageRoutes);
app.use('/api/managerial', managerialRoutes);
app.use('/api/reimburse', reimburseRoutes);
app.use('/api/cuti', cutiRoutes);
app.use('/api/gaji', gajiRoutes);
app.use('/api/insentif', insentifRoutes);
app.use('/api/penalti', penaltiRoutes);
app.use('/api/payroll', payrollRoutes);
// app.use('/api/attendance', attendanceRoutes);

// Error handler (must be after routes)
app.use(apiErrorHandler);


// Database connection
sequelize.sync({ force: false }).then(() => {
  console.log('Database connected');
  schedulePayrollJob(); // Start the cron job
  console.log('Cron job scheduled');
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server jalan di port ${PORT}`);
  });
}).catch((error) => {
  console.error('Unable to connect to the database:', error);
});
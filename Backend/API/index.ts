import express from 'express';
import cors from 'cors';
import path from 'path';
import sequelize from '../config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminUserManageRoutes from './routes/admin.userManage.routes';
import promotionRoutes from './routes/promotion.routes';
import reimburseRoutes from './routes/reimburse.routes';
import cutiRoutes from './routes/cuti.routes';
import gajiRoutes from './routes/gaji.routes';
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
app.use('/api/promotion', promotionRoutes);
app.use('/api/reimburse', reimburseRoutes);
app.use('/api/cuti', cutiRoutes);
app.use('/api/gaji', gajiRoutes);


// Database connection
sequelize.sync({ force: false }).then(() => {
  console.log('Database connected');
  
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server jalan di port ${PORT}`);
  });
}).catch((error) => {
  console.error('Unable to connect to the database:', error);
});
import express from 'express';
import cors from 'cors';
import sequelize from '../config/database';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import adminUserManageRoutes from './routes/admin.userManage.routes';
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
// app.use(sessionMiddleware);
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/', userRoutes);
app.use('/api/admin', adminUserManageRoutes);


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
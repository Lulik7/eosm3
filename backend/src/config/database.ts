/**
 * Конфигурация подключения к базе данных
 */

import mongoose from 'mongoose';

/**
 * Подключение к MongoDB
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/service-desk';
    
    const options = {
      maxPoolSize: 10, // Максимум 10 подключений в пуле
      serverSelectionTimeoutMS: 5000, // Таймаут выбора сервера
      socketTimeoutMS: 45000, // Таймаут сокета
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`MongoDB connected: ${conn.connection.host}`);
    console.log(`Database: ${conn.connection.name}`);

    // Обработка событий подключения
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      process.exit(0);
    });

    return conn;
  } catch (error: any) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;

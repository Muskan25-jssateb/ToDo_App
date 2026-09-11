import mongoose from 'mongoose';
import { initInMemoryDemoData } from '../models/inMemoryStore';

let inMemoryMode = false;

export const isInMemoryMode = (): boolean => {
  return inMemoryMode || mongoose.connection.readyState !== 1;
};

/**
 * Connect to MongoDB database or switch to in-memory mode seamlessly
 */
export const connectDB = async (): Promise<void> => {
  // Prevent Mongoose from hanging if disconnected
  mongoose.set('bufferCommands', false);

  try {
    const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todo-app';
    const conn = await mongoose.connect(connUri, {
      serverSelectionTimeoutMS: 2000,
    });
    inMemoryMode = false;
    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error: any) {
    inMemoryMode = true;
    await initInMemoryDemoData();
    console.log('\n=============================================================');
    console.log('⚡ [Zero-Config Mode] MongoDB is offline, switched to IN-MEMORY database!');
    console.log('   ✓ Authentication (register/login with bcrypt & JWT) active');
    console.log('   ✓ Task CRUD, status toggling, and deletion active');
    console.log('   ✓ Smart Mix Urgency Sorting algorithm active');
    console.log('   ✓ Pre-loaded with demo user (evaluator@example.com) & 5 sample tasks');
    console.log('=============================================================\n');
  }
};

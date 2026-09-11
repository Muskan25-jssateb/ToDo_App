"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = exports.isInMemoryMode = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const inMemoryStore_1 = require("../models/inMemoryStore");
let inMemoryMode = false;
const isInMemoryMode = () => {
    return inMemoryMode || mongoose_1.default.connection.readyState !== 1;
};
exports.isInMemoryMode = isInMemoryMode;
/**
 * Connect to MongoDB database or switch to in-memory mode seamlessly
 */
const connectDB = async () => {
    // Prevent Mongoose from hanging if disconnected
    mongoose_1.default.set('bufferCommands', false);
    try {
        const connUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/todo-app';
        const conn = await mongoose_1.default.connect(connUri, {
            serverSelectionTimeoutMS: 2000,
        });
        inMemoryMode = false;
        console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    }
    catch (error) {
        inMemoryMode = true;
        await (0, inMemoryStore_1.initInMemoryDemoData)();
        console.log('\n=============================================================');
        console.log('⚡ [Zero-Config Mode] MongoDB is offline, switched to IN-MEMORY database!');
        console.log('   ✓ Authentication (register/login with bcrypt & JWT) active');
        console.log('   ✓ Task CRUD, status toggling, and deletion active');
        console.log('   ✓ Smart Mix Urgency Sorting algorithm active');
        console.log('   ✓ Pre-loaded with demo user (evaluator@example.com) & 5 sample tasks');
        console.log('=============================================================\n');
    }
};
exports.connectDB = connectDB;

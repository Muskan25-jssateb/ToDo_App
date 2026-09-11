"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./config/db");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const taskRoutes_1 = __importDefault(require("./routes/taskRoutes"));
const errorMiddleware_1 = require("./middlewares/errorMiddleware");
// Load environment variables
dotenv_1.default.config();
// Initialize Express application
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Enable Cross-Origin Resource Sharing
app.use((0, cors_1.default)());
// Parse incoming JSON and URL-encoded payloads
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Serve interactive web visualizer from public directory
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'online',
        message: 'To-Do Backend API is running smoothly',
        timestamp: new Date().toISOString(),
    });
});
// Mount Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/tasks', taskRoutes_1.default);
// Global Error Handler
app.use(errorMiddleware_1.errorHandler);
// Connect to Database and start server
const startServer = async () => {
    await (0, db_1.connectDB)();
    app.listen(PORT, () => {
        console.log(`[Server] To-Do API listening at http://localhost:${PORT}`);
        console.log(`[Server] Health Check available at http://localhost:${PORT}/api/health`);
    });
};
startServer();
exports.default = app;

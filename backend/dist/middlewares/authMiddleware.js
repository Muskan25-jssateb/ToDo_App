"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const db_1 = require("../config/db");
const inMemoryStore_1 = require("../models/inMemoryStore");
/**
 * Protect routes requiring authentication via JWT
 */
const protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization &&
            req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }
        if (!token) {
            res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
            return;
        }
        const secret = process.env.JWT_SECRET || 'fallback_secret_for_development';
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        if ((0, db_1.isInMemoryMode)()) {
            const user = inMemoryStore_1.inMemoryUsers.find((u) => u._id === decoded.userId);
            if (!user) {
                res.status(401).json({
                    success: false,
                    message: 'The user belonging to this token no longer exists.',
                });
                return;
            }
            req.user = user;
            req.userId = user._id;
            return next();
        }
        const user = await User_1.User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'The user belonging to this token no longer exists.',
            });
            return;
        }
        req.user = user;
        req.userId = user._id.toString();
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid or expired token.',
            error: error.message,
        });
    }
};
exports.protect = protect;

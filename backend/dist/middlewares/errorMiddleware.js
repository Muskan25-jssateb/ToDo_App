"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('[API Error]:', err);
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    // Handle Mongoose duplicate key error (e.g. unique email)
    if (err.code === 11000) {
        statusCode = 400;
        const field = Object.keys(err.keyValue)[0];
        message = `An account with this ${field} already exists.`;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const messages = Object.values(err.errors).map((val) => val.message);
        message = messages.join('. ');
    }
    // Handle invalid Mongoose ObjectId
    if (err.name === 'CastError') {
        statusCode = 404;
        message = `Resource not found with id ${err.value}`;
    }
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};
exports.errorHandler = errorHandler;

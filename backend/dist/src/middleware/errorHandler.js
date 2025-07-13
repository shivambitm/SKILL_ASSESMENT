"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    // Log error
    console.error('Error:', err);
    // MySQL duplicate key error
    if (err.code === 'ER_DUP_ENTRY') {
        const message = 'Resource already exists';
        error = { ...error, statusCode: 400, message };
    }
    // MySQL foreign key constraint error
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        const message = 'Referenced resource not found';
        error = { ...error, statusCode: 400, message };
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        const message = 'Invalid token';
        error = { ...error, statusCode: 401, message };
    }
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expired';
        error = { ...error, statusCode: 401, message };
    }
    // Validation errors
    if (err.name === 'ValidationError') {
        const message = Object.values(err).map((val) => val.message).join(', ');
        error = { ...error, statusCode: 400, message };
    }
    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
};
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map
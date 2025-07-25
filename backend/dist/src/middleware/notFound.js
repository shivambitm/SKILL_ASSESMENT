"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFound = void 0;
const path_1 = __importDefault(require("path"));
const notFound = (req, res, next) => {
    // For API routes, return JSON error
    if (req.originalUrl.startsWith('/api/')) {
        return res.status(404).json({
            success: false,
            message: `API endpoint not found - ${req.originalUrl}`,
            error: 'Not Found'
        });
    }
    // For web routes, serve the 404.html page
    const filePath = path_1.default.resolve(__dirname, '../../public/404.html');
    res.status(404).sendFile(filePath);
};
exports.notFound = notFound;
//# sourceMappingURL=notFound.js.map
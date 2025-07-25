import { Request, Response, NextFunction } from 'express';
import path from 'path';

export const notFound = (req: Request, res: Response, next: NextFunction) => {
  // For API routes, return JSON error
  if (req.originalUrl.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint not found - ${req.originalUrl}`,
      error: 'Not Found'
    });
  }
  
  // For web routes, serve the 404.html page
  const filePath = path.resolve(__dirname, '../../public/404.html');
  res.status(404).sendFile(filePath);
};
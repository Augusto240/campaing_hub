import { AppError, asyncHandler } from '../utils/error-handler';

describe('Error Handler', () => {
  describe('AppError', () => {
    it('should create an AppError with correct properties', () => {
      const error = new AppError(404, 'Resource not found');
      
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe('Resource not found');
      expect(error.isOperational).toBe(true);
    });

    it('should be an instance of Error', () => {
      const error = new AppError(500, 'Server error');
      
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async operations', async () => {
      const mockFn = jest.fn().mockResolvedValue('success');
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(mockFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch and pass errors to next', async () => {
      const error = new Error('Test error');
      const mockFn = jest.fn().mockRejectedValue(error);
      const handler = asyncHandler(mockFn);
      
      const req = {};
      const res = {};
      const next = jest.fn();
      
      await handler(req, res, next);
      
      expect(next).toHaveBeenCalledWith(error);
    });
  });
});

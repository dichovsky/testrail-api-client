import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { base64Encode, sleep } from '../src/utils.js';

describe('Utils', () => {
  describe('base64Encode', () => {
    it('should encode ASCII strings correctly', () => {
      expect(base64Encode('hello')).toBe('aGVsbG8=');
      expect(base64Encode('test@example.com:apikey123')).toBe('dGVzdEBleGFtcGxlLmNvbTphcGlrZXkxMjM=');
      expect(base64Encode('user:password')).toBe('dXNlcjpwYXNzd29yZA==');
    });

    it('should encode Unicode characters correctly', () => {
      expect(base64Encode('hello 世界')).toBe('aGVsbG8g5LiW55WM');
      expect(base64Encode('café')).toBe('Y2Fmw6k=');
      expect(base64Encode('🚀')).toBe('8J+agA==');
      expect(base64Encode('Привет')).toBe('0J/RgNC40LLQtdGC');
    });

    it('should handle empty strings', () => {
      expect(base64Encode('')).toBe('');
    });

    it('should handle special characters', () => {
      expect(base64Encode('!@#$%^&*()')).toBe('IUAjJCVeJiooKQ==');
      expect(base64Encode('line1\nline2')).toBe('bGluZTEKbGluZTI=');
    });
  });

  describe('sleep', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should delay execution for specified duration', async () => {
      const promise = sleep(100);
      
      // Fast-forward time
      vi.advanceTimersByTime(100);
      
      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve after the specified time', async () => {
      const callback = vi.fn();
      
      void sleep(50).then(callback);
      
      expect(callback).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(50);
      
      await vi.runAllTimersAsync();
      
      expect(callback).toHaveBeenCalled();
    });

    it('should handle zero milliseconds', async () => {
      const callback = vi.fn();
      
      void sleep(0).then(callback);
      
      vi.advanceTimersByTime(0);
      
      await vi.runAllTimersAsync();
      
      expect(callback).toHaveBeenCalled();
    });
  });
});

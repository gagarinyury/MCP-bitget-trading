/**
 * Retry Utility
 * Implements exponential backoff retry logic for API calls
 */

import { RetryConfig } from '../types/bitget.js';
import { logger } from './logger.js';

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    '40014', // Rate limit exceeded
    '50001', // Internal server error
    '50002', // Service temporarily unavailable
    '50003', // Service timeout
    '50004', // Service busy
    'NETWORK_ERROR',
    'TIMEOUT_ERROR'
  ]
};

export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
  }

  private isRetryableError(error: any): boolean {
    // Check error code
    if (error.code && this.config.retryableErrors.includes(error.code)) {
      return true;
    }

    // Check error name
    if (error.name && this.config.retryableErrors.includes(error.name)) {
      return true;
    }

    // Check network errors
    if (error.code === 'ECONNRESET' || 
        error.code === 'ENOTFOUND' || 
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT') {
      return true;
    }

    return false;
  }

  private calculateDelay(attempt: number): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, attempt);
    return Math.min(delay, this.config.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async execute<T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt - 1);
          logger.info(`Retrying operation (attempt ${attempt}/${this.config.maxRetries}) after ${delay}ms`, {
            context,
            attempt,
            delay
          });
          await this.sleep(delay);
        }

        const result = await operation();
        
        if (attempt > 0) {
          logger.info(`Operation succeeded after ${attempt} retries`, { context, attempt });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        logger.warn(`Operation failed on attempt ${attempt + 1}`, {
          context,
          attempt: attempt + 1,
          error: (error as any).message,
          errorCode: (error as any).code,
          isRetryable: this.isRetryableError(error)
        });

        // If this is the last attempt or error is not retryable, throw
        if (attempt === this.config.maxRetries || !this.isRetryableError(error)) {
          break;
        }
      }
    }

    logger.error(`Operation failed after ${this.config.maxRetries + 1} attempts`, {
      context,
      totalAttempts: this.config.maxRetries + 1,
      finalError: (lastError as any).message
    });

    throw lastError;
  }
}

// Global retry manager instance
export const retryManager = new RetryManager();
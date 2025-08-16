/**
 * Basic utility tests
 */

describe('Bitget API utilities', () => {
  test('should determine futures symbols correctly', () => {
    const isFuturesSymbol = (symbol: string): boolean => {
      return symbol.includes('_UMCBL') || symbol.includes('_');
    };

    expect(isFuturesSymbol('BTCUSDT_UMCBL')).toBe(true);
    expect(isFuturesSymbol('ETHUSDT_UMCBL')).toBe(true);
    expect(isFuturesSymbol('BTCUSDT')).toBe(false);
    expect(isFuturesSymbol('ETHUSDT')).toBe(false);
  });

  test('should format intervals for futures API', () => {
    const formatIntervalForFuturesAPI = (interval: string): string => {
      const lower = interval.toLowerCase();
      
      // Minutes: keep short format (1m, 5m, 15m, 30m)
      if (lower.match(/^\d+m$/)) {
        return lower;
      }
      
      // Hours: convert to uppercase H (1H, 4H, 6H, 12H)
      if (lower.includes('h')) {
        return lower.replace('h', 'H');
      }
      
      // Days/Weeks/Months: uppercase (1D, 1W, 1M)
      if (lower.includes('d') || lower.includes('w')) {
        return lower.toUpperCase();
      }
      
      return interval;
    };

    expect(formatIntervalForFuturesAPI('1m')).toBe('1m');
    expect(formatIntervalForFuturesAPI('1h')).toBe('1H');
    expect(formatIntervalForFuturesAPI('4h')).toBe('4H');
    expect(formatIntervalForFuturesAPI('1d')).toBe('1D');
  });

  test('should format intervals for spot API', () => {
    const formatIntervalForSpotAPI = (interval: string): string => {
      const lower = interval.toLowerCase();
      
      // Minutes: convert to full format (1min, 5min, 15min, 30min)
      if (lower.match(/^\d+m$/)) {
        return lower.replace('m', 'min');
      }
      
      // Hours: keep lowercase (1h, 4h, 6h, 12h)
      if (lower.includes('h') && !lower.includes('utc')) {
        return lower;
      }
      
      // Days: convert to full format (1day)
      if (lower.match(/^\d+d$/)) {
        return lower.replace('d', 'day');
      }
      
      // Weeks: convert to full format (1week)  
      if (lower.match(/^\d+w$/)) {
        return lower.replace('w', 'week');
      }
      
      return interval;
    };

    expect(formatIntervalForSpotAPI('1m')).toBe('1min');
    expect(formatIntervalForSpotAPI('5m')).toBe('5min');
    expect(formatIntervalForSpotAPI('1h')).toBe('1h');
    expect(formatIntervalForSpotAPI('1d')).toBe('1day');
    expect(formatIntervalForSpotAPI('1w')).toBe('1week');
  });

  test('should validate required parameters', () => {
    const validateOrderParams = (params: any): boolean => {
      const required = ['symbol', 'side', 'type', 'quantity'];
      return required.every(field => {
        const value = params[field];
        return value !== undefined && value !== null && value !== '';
      });
    };

    expect(validateOrderParams({
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'limit',
      quantity: '0.001'
    })).toBe(true);

    expect(validateOrderParams({
      symbol: 'BTCUSDT',
      side: 'buy',
      type: 'limit'
      // missing quantity
    })).toBe(false);

    expect(validateOrderParams({
      symbol: '',
      side: 'buy',
      type: 'limit',
      quantity: '0.001'
    })).toBe(false);
  });
});
import { RateLimiter } from '../rateLimiter';
import { Socket } from 'socket.io';

// Mock Socket
const mockSocket = {
  id: 'test-socket-id',
  emit: jest.fn(),
} as unknown as Socket;

describe('RateLimiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should allow events within rate limit', () => {
    rateLimiter.addLimit('test-event', {
      windowMs: 1000,
      max: 5,
      message: 'Rate limit exceeded',
    });

    for (let i = 0; i < 5; i++) {
      const result = rateLimiter.isRateLimited(mockSocket, 'test-event');
      expect(result.limited).toBe(false);
    }
  });

  it('should block events exceeding rate limit', () => {
    rateLimiter.addLimit('test-event', {
      windowMs: 1000,
      max: 5,
      message: 'Rate limit exceeded',
    });

    for (let i = 0; i < 5; i++) {
      rateLimiter.isRateLimited(mockSocket, 'test-event');
    }

    const result = rateLimiter.isRateLimited(mockSocket, 'test-event');
    expect(result.limited).toBe(true);
    expect(result.message).toBe('Rate limit exceeded');
  });

  it('should reset counter after window expires', () => {
    rateLimiter.addLimit('test-event', {
      windowMs: 1000,
      max: 5,
      message: 'Rate limit exceeded',
    });

    // Fill up the rate limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.isRateLimited(mockSocket, 'test-event');
    }

    // Advance time past the window
    jest.advanceTimersByTime(1100);

    // Should allow new events
    const result = rateLimiter.isRateLimited(mockSocket, 'test-event');
    expect(result.limited).toBe(false);
  });

  it('should handle multiple events independently', () => {
    rateLimiter.addLimit('event1', {
      windowMs: 1000,
      max: 5,
      message: 'Event 1 limit exceeded',
    });

    rateLimiter.addLimit('event2', {
      windowMs: 1000,
      max: 3,
      message: 'Event 2 limit exceeded',
    });

    // Fill up event1
    for (let i = 0; i < 5; i++) {
      rateLimiter.isRateLimited(mockSocket, 'event1');
    }

    // Fill up event2
    for (let i = 0; i < 3; i++) {
      rateLimiter.isRateLimited(mockSocket, 'event2');
    }

    // Check limits
    const result1 = rateLimiter.isRateLimited(mockSocket, 'event1');
    const result2 = rateLimiter.isRateLimited(mockSocket, 'event2');

    expect(result1.limited).toBe(true);
    expect(result2.limited).toBe(true);
  });

  it('should clear client state on disconnect', () => {
    rateLimiter.addLimit('test-event', {
      windowMs: 1000,
      max: 5,
      message: 'Rate limit exceeded',
    });

    // Fill up the rate limit
    for (let i = 0; i < 5; i++) {
      rateLimiter.isRateLimited(mockSocket, 'test-event');
    }

    // Clear client state
    rateLimiter.clearClient(mockSocket);

    // Should allow new events
    const result = rateLimiter.isRateLimited(mockSocket, 'test-event');
    expect(result.limited).toBe(false);
  });

  it('should handle undefined event gracefully', () => {
    const result = rateLimiter.isRateLimited(mockSocket, 'undefined-event');
    expect(result.limited).toBe(false);
  });

  it('should handle multiple clients independently', () => {
    const mockSocket2 = {
      id: 'test-socket-id-2',
      emit: jest.fn(),
    } as unknown as Socket;

    rateLimiter.addLimit('test-event', {
      windowMs: 1000,
      max: 5,
      message: 'Rate limit exceeded',
    });

    // Fill up rate limit for first socket
    for (let i = 0; i < 5; i++) {
      rateLimiter.isRateLimited(mockSocket, 'test-event');
    }

    // Second socket should still be able to emit events
    const result = rateLimiter.isRateLimited(mockSocket2, 'test-event');
    expect(result.limited).toBe(false);
  });
});

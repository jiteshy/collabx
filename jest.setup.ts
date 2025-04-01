// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { performance as nodePerformance } from 'perf_hooks';

// Extend expect with jest-dom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
      toHaveStyle(style: Record<string, any>): R;
      toHaveBeenCalledWith(...args: any[]): R;
    }
  }
}

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
    };
  },
  usePathname() {
    return '';
  },
  useSearchParams() {
    return new URLSearchParams();
  },
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

// Mock socket.io-client
jest.mock('socket.io-client', () => ({
  Manager: jest.fn().mockImplementation(() => ({
    socket: jest.fn().mockReturnValue({
      on: jest.fn(),
      emit: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
    }),
  })),
}));

// Add TextEncoder polyfill
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Request object
global.Request = class Request {
  constructor(input: string | Request, init?: RequestInit) {
    return new URL(input.toString());
  }
} as unknown as typeof global.Request;

// Mock Response object if needed
global.Response = class Response {
  constructor(body?: BodyInit | null, init?: ResponseInit) {
    return {
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      ...init,
    };
  }
} as unknown as typeof global.Response;

// Mock fetch if needed
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
  })
) as unknown as typeof global.fetch; 
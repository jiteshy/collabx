import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';
import { setupSocketServer } from '../server';
import { MessageType } from '@/types';
import { Manager } from 'socket.io-client';
import { DEFAULT_CONTENT, DEFAULT_LANGUAGE } from '@/lib/utils';

interface SyncResponse {
  content: string;
  language: string;
  users: Array<{
    id: number;
    username: string;
    color: string;
    lastActive: number;
    sessionId: string;
  }>;
}

interface ErrorResponse {
  message: string;
  type: string;
}

interface UserEvent {
  user: {
    id: number;
    username: string;
    color: string;
    lastActive: number;
    sessionId: string;
  };
}

interface ContentChangeEvent extends UserEvent {
  content: string;
}

interface LanguageChangeEvent extends UserEvent {
  language: string;
}

interface CursorMoveEvent extends UserEvent {
  position: {
    top: number;
    left: number;
  };
}

interface SelectionChangeEvent extends UserEvent {
  selection: {
    start: number;
    end: number;
  };
}

describe('Socket Server', () => {
  let io: SocketIOServer;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  let serverSocket: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let clientSocket: any;

  beforeAll((done) => {
    const httpServer = createServer();
    io = new SocketIOServer(httpServer);
    setupSocketServer(io);

    httpServer.listen(() => {
      // const port = (httpServer.address() as any).port;
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'test-session' },
      });
      clientSocket = manager.socket('/');
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    io.close();
    clientSocket.close();
  });

  describe('Session Management', () => {
    it('should disconnect socket without sessionId', (done) => {
      const manager = new Manager({
        path: '/',
        query: {},
      });
      const socket = manager.socket('/');

      socket.on('disconnect', () => {
        done();
      });
    });

    it('should create new session on first join', (done) => {
      clientSocket.on(MessageType.SYNC_RESPONSE, (response: SyncResponse) => {
        expect(response.content).toBe(DEFAULT_CONTENT);
        expect(response.language).toBe(DEFAULT_LANGUAGE);
        expect(response.users).toHaveLength(1);
        done();
      });

      clientSocket.emit(MessageType.JOIN, { username: 'testUser' });
    });

    it('should clean up empty sessions on last user leave', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'cleanup-session' },
      });
      const socket = manager.socket('/');

      socket.on('connect', () => {
        socket.emit(MessageType.JOIN, { username: 'cleanupUser' });
      });

      socket.on(MessageType.SYNC_RESPONSE, () => {
        socket.disconnect();
      });

      socket.on('disconnect', () => {
        // Wait for cleanup
        setTimeout(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const session = (io as any).sockets.adapter.rooms.get('cleanup-session');
          expect(session).toBeUndefined();
          done();
        }, 100);
      });
    });
  });

  describe('User Management', () => {
    it('should prevent duplicate usernames', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'duplicate-session' },
      });
      const socket1 = manager.socket('/');
      const socket2 = manager.socket('/');

      socket1.on('connect', () => {
        socket1.emit(MessageType.JOIN, { username: 'testUser' });
      });

      socket2.on('connect', () => {
        socket2.emit(MessageType.JOIN, { username: 'testUser' });
      });

      socket2.on(MessageType.ERROR, (error: ErrorResponse) => {
        expect(error.type).toBe('DUPLICATE_USERNAME');
        expect(error.message).toBe('Username already taken');
        done();
      });
    });

    it('should prevent joining full sessions', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'full-session' },
      });
      const sockets = Array(6)
        .fill(null)
        .map(() => manager.socket('/'));

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let connectedCount = 0;
      sockets.forEach((socket, index) => {
        socket.on('connect', () => {
          socket.emit(MessageType.JOIN, { username: `user${index}` });
          connectedCount++;
        });

        socket.on(MessageType.ERROR, (error: ErrorResponse) => {
          if (error.type === 'SESSION_FULL') {
            expect(error.message).toBe('Session is full');
            done();
          }
        });
      });
    });

    it('should notify other users when a user joins', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'join-notify-session' },
      });
      const socket1 = manager.socket('/');
      const socket2 = manager.socket('/');

      socket1.on('connect', () => {
        socket1.emit(MessageType.JOIN, { username: 'user1' });
      });

      socket2.on('connect', () => {
        socket2.emit(MessageType.JOIN, { username: 'user2' });
      });

      socket1.on(MessageType.USER_JOINED, (data: UserEvent) => {
        expect(data.user.username).toBe('user2');
        done();
      });
    });

    it('should notify other users when a user leaves', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'leave-notify-session' },
      });
      const socket1 = manager.socket('/');
      const socket2 = manager.socket('/');

      socket1.on('connect', () => {
        socket1.emit(MessageType.JOIN, { username: 'user1' });
      });

      socket2.on('connect', () => {
        socket2.emit(MessageType.JOIN, { username: 'user2' });
      });

      socket1.on(MessageType.USER_LEFT, (data: UserEvent) => {
        expect(data.user.username).toBe('user2');
        done();
      });

      socket2.on(MessageType.SYNC_RESPONSE, () => {
        socket2.disconnect();
      });
    });
  });

  describe('Content Synchronization', () => {
    it('should sync content on initial join', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'sync-session' },
      });
      const socket = manager.socket('/');

      socket.on('connect', () => {
        socket.emit(MessageType.JOIN, { username: 'syncUser' });
      });

      socket.on(MessageType.SYNC_RESPONSE, (response: SyncResponse) => {
        expect(response.content).toBe(DEFAULT_CONTENT);
        expect(response.language).toBe(DEFAULT_LANGUAGE);
        done();
      });
    });

    it('should handle sync requests', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'sync-request-session' },
      });
      const socket = manager.socket('/');

      socket.on('connect', () => {
        socket.emit(MessageType.JOIN, { username: 'syncRequestUser' });
      });

      socket.on(MessageType.SYNC_RESPONSE, (response: SyncResponse) => {
        expect(response.content).toBe(DEFAULT_CONTENT);
        expect(response.language).toBe(DEFAULT_LANGUAGE);
        done();
      });

      socket.emit(MessageType.SYNC_REQUEST);
    });
  });

  describe('Content and Language Changes', () => {
    it('should broadcast content changes to other users', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'content-session' },
      });
      const socket1 = manager.socket('/');
      const socket2 = manager.socket('/');

      socket1.on('connect', () => {
        socket1.emit(MessageType.JOIN, { username: 'contentUser1' });
      });

      socket2.on('connect', () => {
        socket2.emit(MessageType.JOIN, { username: 'contentUser2' });
      });

      socket2.on(MessageType.CONTENT_CHANGE, (data: ContentChangeEvent) => {
        expect(data.content).toBe('new content');
        expect(data.user.username).toBe('contentUser1');
        done();
      });

      socket1.on(MessageType.SYNC_RESPONSE, () => {
        socket1.emit(MessageType.CONTENT_CHANGE, { content: 'new content' });
      });
    });

    it('should broadcast language changes to other users', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'language-session' },
      });
      const socket1 = manager.socket('/');
      const socket2 = manager.socket('/');

      socket1.on('connect', () => {
        socket1.emit(MessageType.JOIN, { username: 'languageUser1' });
      });

      socket2.on('connect', () => {
        socket2.emit(MessageType.JOIN, { username: 'languageUser2' });
      });

      socket2.on(MessageType.LANGUAGE_CHANGE, (data: LanguageChangeEvent) => {
        expect(data.language).toBe('javascript');
        expect(data.user.username).toBe('languageUser1');
        done();
      });

      socket1.on(MessageType.SYNC_RESPONSE, () => {
        socket1.emit(MessageType.LANGUAGE_CHANGE, { language: 'javascript' });
      });
    });
  });

  describe('Cursor and Selection Changes', () => {
    it('should broadcast cursor movements to other users', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'cursor-session' },
      });
      const socket1 = manager.socket('/');
      const socket2 = manager.socket('/');

      socket1.on('connect', () => {
        socket1.emit(MessageType.JOIN, { username: 'cursorUser1' });
      });

      socket2.on('connect', () => {
        socket2.emit(MessageType.JOIN, { username: 'cursorUser2' });
      });

      socket2.on(MessageType.CURSOR_MOVE, (data: CursorMoveEvent) => {
        expect(data.position).toEqual({ top: 100, left: 200 });
        expect(data.user.username).toBe('cursorUser1');
        done();
      });

      socket1.on(MessageType.SYNC_RESPONSE, () => {
        socket1.emit(MessageType.CURSOR_MOVE, { position: { top: 100, left: 200 } });
      });
    });

    it('should broadcast selection changes to other users', (done) => {
      const manager = new Manager({
        path: '/',
        query: { sessionId: 'selection-session' },
      });
      const socket1 = manager.socket('/');
      const socket2 = manager.socket('/');

      socket1.on('connect', () => {
        socket1.emit(MessageType.JOIN, { username: 'selectionUser1' });
      });

      socket2.on('connect', () => {
        socket2.emit(MessageType.JOIN, { username: 'selectionUser2' });
      });

      socket2.on(MessageType.SELECTION_CHANGE, (data: SelectionChangeEvent) => {
        expect(data.selection).toEqual({ start: 0, end: 10 });
        expect(data.user.username).toBe('selectionUser1');
        done();
      });

      socket1.on(MessageType.SYNC_RESPONSE, () => {
        socket1.emit(MessageType.SELECTION_CHANGE, { selection: { start: 0, end: 10 } });
      });
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should allow content changes within rate limit', (done) => {
      const content = 'test content';
      let count = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clientSocket.on(MessageType.ERROR, (error: any) => {
        if (error.type === 'RATE_LIMIT_EXCEEDED') {
          expect(count).toBeLessThanOrEqual(50); // Should not exceed rate limit
          done();
        }
      });

      // Send 50 content changes (within limit)
      for (let i = 0; i < 50; i++) {
        clientSocket.emit(MessageType.CONTENT_CHANGE, { content: `${content}${i}` });
        count++;
      }

      // Send one more to trigger rate limit
      clientSocket.emit(MessageType.CONTENT_CHANGE, { content: `${content}51` });
      count++;
    });

    it('should block content changes exceeding rate limit', (done) => {
      const content = 'test content';

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      let rateLimitExceeded = false;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clientSocket.on(MessageType.ERROR, (error: any) => {
        if (error.type === 'RATE_LIMIT_EXCEEDED') {
          rateLimitExceeded = true;
          expect(error.message).toBe('Too many content changes. Please wait a moment.');
          done();
        }
      });

      // Send 51 content changes (exceeding limit)
      for (let i = 0; i < 51; i++) {
        clientSocket.emit(MessageType.CONTENT_CHANGE, { content: `${content}${i}` });
      }
    });

    it('should reset rate limit after window expires', (done) => {
      const content = 'test content';
      let count = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clientSocket.on(MessageType.ERROR, (error: any) => {
        if (error.type === 'RATE_LIMIT_EXCEEDED') {
          expect(count).toBeLessThanOrEqual(50);
          done();
        }
      });

      // Send 50 content changes
      for (let i = 0; i < 50; i++) {
        clientSocket.emit(MessageType.CONTENT_CHANGE, { content: `${content}${i}` });
        count++;
      }

      // Advance time past the window (1 second)
      jest.advanceTimersByTime(1100);

      // Should be able to send more content changes
      clientSocket.emit(MessageType.CONTENT_CHANGE, { content: `${content}new` });
      count++;
    });

    it('should handle rate limiting for multiple event types independently', (done) => {
      let contentCount = 0;
      let cursorCount = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clientSocket.on(MessageType.ERROR, (error: any) => {
        if (error.type === 'RATE_LIMIT_EXCEEDED') {
          expect(contentCount).toBeLessThanOrEqual(50);
          expect(cursorCount).toBeLessThanOrEqual(100);
          done();
        }
      });

      // Send content changes up to limit
      for (let i = 0; i < 50; i++) {
        clientSocket.emit(MessageType.CONTENT_CHANGE, { content: `content${i}` });
        contentCount++;
      }

      // Send cursor movements up to limit
      for (let i = 0; i < 100; i++) {
        clientSocket.emit(MessageType.CURSOR_MOVE, { position: { top: i, left: i } });
        cursorCount++;
      }

      // Try to exceed both limits
      clientSocket.emit(MessageType.CONTENT_CHANGE, { content: 'exceed' });
      clientSocket.emit(MessageType.CURSOR_MOVE, { position: { top: 101, left: 101 } });
    });

    it('should handle rate limiting for join attempts', (done) => {
      let joinCount = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clientSocket.on(MessageType.ERROR, (error: any) => {
        if (error.type === 'RATE_LIMIT_EXCEEDED') {
          expect(joinCount).toBeLessThanOrEqual(5);
          expect(error.message).toBe(
            'Too many join attempts. Please wait a moment before trying again.',
          );
          done();
        }
      });

      // Try to join 6 times (exceeding limit)
      for (let i = 0; i < 6; i++) {
        clientSocket.emit(MessageType.JOIN, { username: `user${i}` });
        joinCount++;
      }
    });

    it('should clear rate limit state on disconnect', (done) => {
      const content = 'test content';
      let count = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      clientSocket.on(MessageType.ERROR, (error: any) => {
        if (error.type === 'RATE_LIMIT_EXCEEDED') {
          expect(count).toBeLessThanOrEqual(50);
          done();
        }
      });

      // Send 50 content changes
      for (let i = 0; i < 50; i++) {
        clientSocket.emit(MessageType.CONTENT_CHANGE, { content: `${content}${i}` });
        count++;
      }

      // Disconnect and reconnect
      clientSocket.disconnect();
      clientSocket.connect();

      // Should be able to send more content changes after reconnecting
      clientSocket.emit(MessageType.CONTENT_CHANGE, { content: `${content}new` });
      count++;
    });
  });
});

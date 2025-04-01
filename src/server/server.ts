import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { MessageType } from '@/types';
import { DEFAULT_CONTENT, DEFAULT_LANGUAGE, getRandomColor } from '@/lib/utils';
import { RateLimiter } from './rateLimiter';
import { ValidationService } from './validation';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

// Store sessions with their users
const sessions = new Map<
  string,
  {
    id: string;
    content: string;
    language: string;
    lastActive: number;
    users: Map<
      number,
      {
        id: number;
        username: string;
        color: string;
        lastActive: number;
        sessionId: string;
      }
    >;
  }
>();

let currentUserId = 1;
const MAX_USERS_PER_SESSION = 5;

// Initialize rate limiter
const rateLimiter = new RateLimiter();

// Configure rate limits
rateLimiter.addLimit(MessageType.JOIN, {
  windowMs: 60000, // 1 minute
  max: 5, // 5 join attempts per minute
  message: 'Too many join attempts. Please wait a moment before trying again.',
});

rateLimiter.addLimit(MessageType.CONTENT_CHANGE, {
  windowMs: 1000, // 1 second
  max: 50, // 50 events per second
  message: 'Too many content changes. Please wait a moment.',
});

rateLimiter.addLimit(MessageType.CURSOR_MOVE, {
  windowMs: 1000, // 1 second
  max: 100, // 100 events per second
  message: 'Too many cursor movements. Please wait a moment.',
});

rateLimiter.addLimit(MessageType.SELECTION_CHANGE, {
  windowMs: 1000, // 1 second
  max: 50, // 50 events per second
  message: 'Too many selection changes. Please wait a moment.',
});

rateLimiter.addLimit(MessageType.LANGUAGE_CHANGE, {
  windowMs: 5000, // 5 seconds
  max: 10, // 10 events per 5 seconds
  message: 'Too many language changes. Please wait a moment.',
});

export function setupSocketServer(io: SocketIOServer) {
  io.on('connection', (socket) => {
    const sessionId = socket.handshake.query.sessionId as string;

    // Validate session ID
    const sessionIdError = ValidationService.validateSessionId(sessionId);
    if (sessionIdError) {
      socket.emit(MessageType.ERROR, sessionIdError);
      socket.disconnect();
      return;
    }

    socket.join(sessionId);

    // Wrap event handlers with rate limiting and validation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wrapWithValidationAndRateLimit = (event: string, handler: (...args: any[]) => void) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (...args: any[]) => {
        // First check rate limiting
        const { limited, message: rateLimitMessage } = rateLimiter.isRateLimited(socket, event);
        if (limited) {
          socket.emit(MessageType.ERROR, {
            message: rateLimitMessage,
            type: 'RATE_LIMIT_EXCEEDED',
          });
          return;
        }

        // Then validate payload
        const validationError = ValidationService.validateEventPayload(
          event as MessageType,
          args[0],
        );
        if (validationError) {
          socket.emit(MessageType.ERROR, validationError);
          return;
        }

        handler(...args);
      };
    };

    socket.on(
      MessageType.JOIN,
      wrapWithValidationAndRateLimit(MessageType.JOIN, (payload: { username: string }) => {
        // Get or create session
        let session = sessions.get(sessionId);
        if (!session) {
          session = {
            id: sessionId,
            content: DEFAULT_CONTENT,
            language: DEFAULT_LANGUAGE,
            lastActive: Date.now(),
            users: new Map(),
          };
          sessions.set(sessionId, session);
        }

        // Check for duplicate username
        if (Array.from(session.users.values()).some((user) => user.username === payload.username)) {
          socket.emit(MessageType.ERROR, {
            message: 'Username already taken',
            type: 'DUPLICATE_USERNAME',
          });
          socket.disconnect();
          return;
        }

        // Check if session is full
        if (session.users.size >= MAX_USERS_PER_SESSION) {
          socket.emit(MessageType.ERROR, { message: 'Session is full', type: 'SESSION_FULL' });
          socket.disconnect();
          return;
        }

        // Create new user
        const userId = currentUserId++;
        const user = {
          id: userId,
          username: payload.username,
          color: getRandomColor(),
          lastActive: Date.now(),
          sessionId,
        };

        // Add user to session
        session.users.set(userId, user);
        session.lastActive = Date.now();
        socket.data.userId = userId;

        // Send sync response to new user
        socket.emit(MessageType.SYNC_RESPONSE, {
          content: session.content,
          language: session.language,
          users: Array.from(session.users.values()),
        });

        // Notify other users
        socket.to(sessionId).emit(MessageType.USER_JOINED, { user });
      }),
    );

    socket.on(MessageType.SYNC_REQUEST, () => {
      const session = sessions.get(sessionId);
      if (session) {
        socket.emit(MessageType.SYNC_RESPONSE, {
          content: session.content,
          language: session.language,
          users: Array.from(session.users.values()),
        });
      }
    });

    socket.on(
      MessageType.CONTENT_CHANGE,
      wrapWithValidationAndRateLimit(MessageType.CONTENT_CHANGE, (payload: { content: string }) => {
        const session = sessions.get(sessionId);
        const userId = socket.data.userId;

        if (session && userId) {
          session.content = payload.content;
          session.lastActive = Date.now();
          const user = session.users.get(userId);
          if (user) {
            socket.to(sessionId).emit(MessageType.CONTENT_CHANGE, {
              content: payload.content,
              user,
            });
          }
        }
      }),
    );

    socket.on(
      MessageType.LANGUAGE_CHANGE,
      wrapWithValidationAndRateLimit(
        MessageType.LANGUAGE_CHANGE,
        (payload: { language: string }) => {
          const session = sessions.get(sessionId);
          const userId = socket.data.userId;

          if (session && userId) {
            session.language = payload.language;
            session.lastActive = Date.now();
            const user = session.users.get(userId);
            if (user) {
              socket.to(sessionId).emit(MessageType.LANGUAGE_CHANGE, {
                language: payload.language,
                user,
              });
            }
          }
        },
      ),
    );

    socket.on(
      MessageType.CURSOR_MOVE,
      wrapWithValidationAndRateLimit(
        MessageType.CURSOR_MOVE,
        (payload: { position: { top: number; left: number } }) => {
          const session = sessions.get(sessionId);
          const userId = socket.data.userId;

          if (session && userId) {
            const user = session.users.get(userId);
            if (user) {
              socket.to(sessionId).emit(MessageType.CURSOR_MOVE, {
                position: payload.position,
                user,
              });
            }
          }
        },
      ),
    );

    socket.on(
      MessageType.SELECTION_CHANGE,
      wrapWithValidationAndRateLimit(
        MessageType.SELECTION_CHANGE,
        (payload: { selection: { start: number; end: number } }) => {
          const session = sessions.get(sessionId);
          const userId = socket.data.userId;

          if (session && userId) {
            const user = session.users.get(userId);
            if (user) {
              socket.to(sessionId).emit(MessageType.SELECTION_CHANGE, {
                selection: payload.selection,
                user,
              });
            }
          }
        },
      ),
    );

    socket.on('disconnect', () => {
      const session = sessions.get(sessionId);
      const userId = socket.data.userId;

      if (session && userId) {
        const user = session.users.get(userId);
        if (user) {
          session.users.delete(userId);
          socket.to(sessionId).emit(MessageType.USER_LEFT, { user });

          // Clean up empty sessions
          if (session.users.size === 0) {
            sessions.delete(sessionId);
          }
        }
      }

      // Clear rate limit state for disconnected client
      rateLimiter.clearClient(socket);
    });
  });
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    path: '/api/ws',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  setupSocketServer(io);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

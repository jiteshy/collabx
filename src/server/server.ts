import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { MessageType } from '@/types';
import { DEFAULT_CONTENT, DEFAULT_LANGUAGE, getRandomColor } from '@/lib/utils';

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

export function setupSocketServer(io: SocketIOServer) {
  io.on('connection', socket => {
    const sessionId = socket.handshake.query.sessionId as string;

    if (!sessionId) {
      socket.disconnect();
      return;
    }

    socket.join(sessionId);

    socket.on(MessageType.JOIN, (payload: { username: string }) => {
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
      if (Array.from(session.users.values()).some(user => user.username === payload.username)) {
        socket.emit(MessageType.ERROR, { message: 'Username already taken', type: 'DUPLICATE_USERNAME' });
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
    });

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

    socket.on(MessageType.CONTENT_CHANGE, (payload: { content: string }) => {
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
    });

    socket.on(MessageType.LANGUAGE_CHANGE, (payload: { language: string }) => {
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
    });

    socket.on(MessageType.CURSOR_MOVE, (payload: { position: { top: number; left: number } }) => {
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
    });

    socket.on(
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
      }
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

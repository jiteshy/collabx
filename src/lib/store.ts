import { create } from 'zustand';
import { User, UserCursor, UserSelection } from '@/types';
import { DEFAULT_LANGUAGE, DEFAULT_CONTENT } from './utils';

interface EditorState {
  content: string;
  language: string;
  users: User[];
  cursors: UserCursor[];
  selections: UserSelection[];
  error: string | null;
  setContent: (content: string) => void;
  setLanguage: (language: string) => void;
  addUser: (user: User) => void;
  removeUser: (userId: number) => void;
  updateCursor: (cursor: UserCursor) => void;
  removeCursor: (userId: number) => void;
  updateSelection: (selection: UserSelection) => void;
  removeSelection: (userId: number) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useStore = create<EditorState>((set, get) => ({
  content: DEFAULT_CONTENT,
  language: DEFAULT_LANGUAGE,
  users: [],
  cursors: [],
  selections: [],
  error: null,

  setContent: content => set({ content }),
  setLanguage: language => set({ language }),

  addUser: user => {
    set(state => {
      // Check if user already exists
      if (state.users.some(u => u.id === user.id)) {
        return state;
      }
      return { users: [...state.users, user] };
    });
  },

  removeUser: userId => {
    set(state => ({
      users: state.users.filter(u => u.id !== userId),
      cursors: state.cursors.filter(c => c.userId !== userId),
      selections: state.selections.filter(s => s.userId !== userId),
    }));
  },

  updateCursor: cursor => {
    set(state => ({
      cursors: [...state.cursors.filter(c => c.userId !== cursor.userId), cursor],
    }));
  },

  removeCursor: userId => {
    set(state => ({
      cursors: state.cursors.filter(c => c.userId !== userId),
    }));
  },

  updateSelection: selection => {
    set(state => ({
      selections: [...state.selections.filter(s => s.userId !== selection.userId), selection],
    }));
  },

  removeSelection: userId => {
    set(state => ({
      selections: state.selections.filter(s => s.userId !== userId),
    }));
  },

  setError: error => set({ error }),

  reset: () =>
    set({
      content: DEFAULT_CONTENT,
      language: DEFAULT_LANGUAGE,
      users: [],
      cursors: [],
      selections: [],
      error: null,
    }),
}));

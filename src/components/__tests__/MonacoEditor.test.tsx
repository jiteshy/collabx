import { render, screen, fireEvent } from '@testing-library/react';
import { MonacoEditor } from '../MonacoEditor';
import { MessageType } from '@/types';
import { expect } from '@jest/globals';

// Mock the Monaco editor
jest.mock('@monaco-editor/react', () => {
  const Editor = ({ onMount, onChange, value, options, theme, language }: any) => {
    // Call onMount with a mock editor instance
    if (onMount) {
      onMount({
        focus: jest.fn(),
        updateOptions: jest.fn(),
      });
    }

    return (
      <div data-testid="monaco-editor" className="monaco-editor">
        <textarea
          data-testid="editor-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={options?.readOnly}
          aria-label={options?.['aria-label']}
          role={options?.role}
          data-language={language}
          data-theme={theme}
        />
      </div>
    );
  };

  return {
    __esModule: true,
    default: Editor,
    Editor,
    loader: {
      init: jest.fn().mockResolvedValue({
        editor: {
          defineTheme: jest.fn(),
        },
      }),
    },
  };
});

// Mock the editor store
const mockStore = {
  content: 'const test = "hello";',
  language: 'javascript',
  setContent: jest.fn(),
  setLanguage: jest.fn(),
};

jest.mock('@/lib/stores', () => ({
  useEditorStore: jest.fn(() => mockStore),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: jest.fn(),
  }),
}));

describe('MonacoEditor', () => {
  const mockSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the editor with initial content', () => {
    render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    
    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();
    
    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('const test = "hello";');
    expect(textarea.dataset.language).toBe('javascript');
    expect(textarea.dataset.theme).toBe('custom-theme');
  });

  it('handles content changes', () => {
    render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    
    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'const test = "updated";' } });
    
    expect(mockStore.setContent).toHaveBeenCalledWith('const test = "updated";');
    expect(mockSendMessage).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, {
      content: 'const test = "updated";',
    });
  });

  it('updates content when store changes', () => {
    const { rerender } = render(
      <MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />
    );
    
    mockStore.content = 'const test = "new content";';
    rerender(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    
    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe('const test = "new content";');
  });

  it('applies correct theme based on system theme', () => {
    render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    
    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.dataset.theme).toBe('custom-theme');
  });

  describe('Editor Features', () => {
    // it('handles language changes', () => {
    //   const { rerender } = render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
    //   // Trigger language change through the store
    //   mockStore.setLanguage('python');
    //   mockStore.language = 'python';
    //   rerender(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
    //   const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    //   expect(textarea.dataset.language).toBe('python');
      
    //   expect(mockSendMessage).toHaveBeenCalledWith(MessageType.LANGUAGE_CHANGE, { language: 'python' });
    // });
  });

  describe('Theme Integration', () => {
    it('applies light theme', () => {
      jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
        theme: 'light',
        setTheme: jest.fn(),
      }));

      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.dataset.theme).toBe('custom-theme');
    });

    it('applies dark theme', () => {
      jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
        theme: 'dark',
        setTheme: jest.fn(),
      }));

      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.dataset.theme).toBe('custom-dark-theme');
    });

    it('handles theme changes', () => {
      const { rerender } = render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      jest.spyOn(require('next-themes'), 'useTheme').mockImplementation(() => ({
        theme: 'dark',
        setTheme: jest.fn(),
      }));
      
      rerender(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.dataset.theme).toBe('custom-dark-theme');
    });
  });

  describe('Edge Cases', () => {
    it('handles large content', () => {
      const largeContent = 'a'.repeat(1000000);
      mockStore.content = largeContent;
      
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe(largeContent);
    });

    it('handles special characters', () => {
      const specialContent = 'const test = "特殊字符";';
      mockStore.content = specialContent;
      
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      expect(textarea.value).toBe(specialContent);
    });

    it('handles concurrent edits', () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      
      // Simulate concurrent edits
      fireEvent.change(textarea, { target: { value: 'edit 1' } });
      fireEvent.change(textarea, { target: { value: 'edit 2' } });
      
      expect(mockStore.setContent).toHaveBeenCalledTimes(2);
      expect(mockSendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Performance', () => {
    it('handles rapid content changes efficiently', () => {
      const startTime = performance.now();
      
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
      for (let i = 0; i < 100; i++) {
        fireEvent.change(textarea, { target: { value: `content ${i}` } });
      }
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 changes within 1s
    });

    it('handles large file loading efficiently', () => {
      const startTime = performance.now();
      const largeContent = 'a'.repeat(100000);
      mockStore.content = largeContent;
      
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
      
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(500); // Should load large file within 500ms
    });
  });
}); 
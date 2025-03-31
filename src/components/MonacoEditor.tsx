import { useEffect, useRef } from 'react';
import Editor, { EditorProps, loader } from '@monaco-editor/react';
import type { editor as MonacoEditorType } from 'monaco-editor';
import { useEditorStore, useUserStore } from '@/lib/stores';
import { DEFAULT_CONTENT, DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from '@/lib/utils';
import { MessageType } from '@/types';
import { useTheme } from 'next-themes';

// Initialize monaco loader
loader.init().then(monaco => {
  monaco.editor.defineTheme('custom-theme', {
    base: 'vs',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#ffffff',
      'editorGutter.background': '#f4f4f5',
      'editorLineNumber.foreground': '#9f9fa9',
      'editorLineNumber.activeForeground': '#52525c',
    },
  });

  monaco.editor.defineTheme('custom-dark-theme', {
    base: 'vs-dark',
    inherit: true,
    rules: [],
    colors: {
      'editor.background': '#18181b',
      'editorGutter.background': '#27272a',
      'editorLineNumber.foreground': '#52525c',
      'editorLineNumber.activeForeground': '#9f9fa9',
    },
  });
});

interface MonacoEditorProps {
  sessionId: string;
  username: string;
  sendMessage: (type: MessageType, payload: any) => void;
  readOnly?: boolean;
}

export function MonacoEditor({
  sessionId,
  username,
  sendMessage,
  readOnly = false,
}: MonacoEditorProps) {
  const { content, language, setContent, setLanguage, setError } = useEditorStore();

  const { cursors, selections } = useUserStore();

  const { theme } = useTheme();

  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setContent(value);
      sendMessage(MessageType.CONTENT_CHANGE, { content: value });
    }
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    sendMessage(MessageType.LANGUAGE_CHANGE, { language: value });
  };

  const editorProps: EditorProps = {
    height: '100%',
    defaultLanguage: DEFAULT_LANGUAGE,
    defaultValue: DEFAULT_CONTENT,
    value: content,
    language: language,
    theme: theme === 'dark' ? 'custom-dark-theme' : 'custom-theme',
    onMount: handleEditorDidMount,
    onChange: handleEditorChange,
    options: {
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      renderWhitespace: 'selection',
      cursorStyle: 'line',
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      padding: { top: 8, bottom: 48 },
      selectOnLineNumbers: true,
      lineNumbersMinChars: 4,
      lineDecorationsWidth: 0,
      // renderLineHighlight: 'none',
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        arrowSize: 30,
      },
    },
  };

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-dark',
        wordWrap: 'on',
        renderWhitespace: 'selection',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
        },
      });
    }
  }, [editorRef, readOnly]);

  return (
    <div className="h-full w-full">
      <Editor {...editorProps} />
    </div>
  );
}

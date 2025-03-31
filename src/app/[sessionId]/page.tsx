'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MonacoEditor } from '@/components/MonacoEditor';
import { useEditorStore, useUserStore } from '@/lib/stores';
import { getRandomUsername } from '@/lib/utils';
import { toast } from 'sonner';
import { SessionCard } from '@/components/SessionCard';
import { Header } from '@/components/Header';
import { HeroSection } from '@/components/HeroSection';
import { EditorHeader } from '@/components/EditorHeader';
import { Footer } from '@/components/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SessionFullDialog } from '@/components/ui/SessionFullDialog';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [username, setUsername] = useState<string | null>(null);
  const { language, setLanguage } = useEditorStore();
  const users = useUserStore(state => state.users);
  const { sendMessage, isSessionFull, setIsSessionFull } = useWebSocket(sessionId, username || '');

  useEffect(() => {
    const randomUsername = getRandomUsername();
    setUsername(randomUsername);
  }, []);

  if (!username) {
    return null;
  }

  const copySessionLink = () => {
    const url = `${window.location.origin}/${sessionId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success('Session link copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy session link');
      });
  };

  const handleViewReadOnly = () => {
    setIsSessionFull(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col lg:flex-row">
        {/* Left Column */}
        <div className="w-full lg:w-1/3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 flex flex-col lg:h-screen overflow-hidden">
          <div className="w-full md:w-4/5 m-auto lg:w-full">
            <Header />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-4 lg:p-6 lg:pt-0 w-full md:w-4/5 m-auto lg:w-full">
              <div className="flex md:grid flex-col md:grid-cols-2 lg:flex lg:flex-col gap-4 lg:h-[calc(100vh-140px)]">
                <HeroSection />

                <SessionCard
                  sessionId={sessionId}
                  username={username}
                  users={users}
                  copySessionLink={copySessionLink}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="relative lg:w-2/3 lg:pt-4 lg:pb-12 lg:pr-6 pb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 lg:from-slate-700 lg:via-slate-700 lg:to-slate-700 flex min-h-[500px] lg:min-h-screen">
          {/* Editor Section */}
          <div className="flex-1 px-4 lg:px-0">
            <div className="bg-zinc-100 w-full md:w-4/5 m-auto lg:w-full border rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col dark:bg-zinc-800">
              <EditorHeader
                language={language}
                setLanguage={setLanguage}
                users={users}
                username={username}
                readOnly={isSessionFull}
              />

              <div className="flex-1">
                <MonacoEditor
                  sessionId={sessionId}
                  username={username}
                  sendMessage={sendMessage}
                  readOnly={isSessionFull}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <SessionFullDialog
        isOpen={isSessionFull}
        onClose={() => setIsSessionFull(false)}
        onViewReadOnly={handleViewReadOnly}
      />
    </div>
  );
}

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/lib/stores/userStore';
import { useEditorStore } from '@/lib/stores/editorStore';

interface SessionFullDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onViewReadOnly: () => void;
}

export function SessionFullDialog({
  isOpen,
  onClose,
  onViewReadOnly,
}: SessionFullDialogProps) {
  const router = useRouter();
  const resetUser = useUserStore(state => state.reset);
  const resetEditor = useEditorStore(state => state.reset);

  const handleCreateNewSession = () => {
    // Reset stores
    resetUser();
    resetEditor();

    // Generate a random session ID
    const newSessionId = Math.random().toString(36).substring(2, 8);
    router.push(`/${newSessionId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Session Full</DialogTitle>
          <DialogDescription>
            This session has reached its maximum capacity. You can view it in read-only mode or
            create a new session.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onViewReadOnly}>
            View in Read-Only Mode
          </Button>
          <Button onClick={handleCreateNewSession}>Create New Session</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

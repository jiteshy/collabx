import { ThemeToggle } from '@/components/theme-toggle';
import { Brand } from '@/components/brand';

export function Header() {
  return (
    <div className="p-4 lg:pl-6 border-b border-slate-700/50">
      <div className="flex justify-between">
        <Brand compact />
        <ThemeToggle />
      </div>
    </div>
  );
}

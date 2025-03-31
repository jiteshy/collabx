import { Zap, Globe2 } from 'lucide-react';

export function Footer() {
  return (
    <div className="w-full lg:absolute bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 lg:from-transparent lg:via-transparent lg:to-transparent bottom-0 px-4 lg:px-6 py-1">
      <div className="flex justify-between items-center text-xs lg:text-sm text-slate-300">
        <span>© {new Date().getFullYear()} CollabX. All rights reserved.</span>
        <div className="lg:flex justify-center gap-4 lg:gap-8 hidden">
          {[
            { icon: Zap, text: 'Real-time collaboration' },
            { icon: Globe2, text: 'No sign-up required' },
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-1.5 lg:gap-2">
              <div className="w-6 h-6 lg:w-8 lg:h-8 flex items-center justify-center">
                <feature.icon className="h-3 w-3 lg:h-4 lg:w-4" />
              </div>
              <span className="text-xs lg:text-sm">{feature.text}</span>
            </div>
          ))}
        </div>
        <a
          href="mailto:info@collabx.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors"
        >
          Submit Feedback
        </a>
      </div>
    </div>
  );
}

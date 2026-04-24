import { Users, Circle } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Brand, BrandWordmark } from '@/components/brand';

export function LandingContent() {
  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col lg:flex-row">
        {/* Left Column */}
        <div className="w-full lg:w-1/3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 flex flex-col lg:h-screen overflow-hidden">
          <div className="w-full md:w-4/5 m-auto lg:w-full">
            {/* Header */}
            <div className="p-4 lg:pl-6 border-b border-slate-700/50">
              <div className="flex justify-between">
                <Brand compact />
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-4 lg:pt-0 w-full md:w-4/5 m-auto lg:w-full">
              <div className="flex md:grid flex-col md:grid-cols-2 lg:flex lg:flex-col gap-4 lg:h-[calc(100vh-140px)]">
                {/* Hero Section */}
                <div className="text-center md:text-left lg:pl-2 lg:pt-5">
                  <h1 className="text-3xl text-white mb-3 lg:mb-4">
                    <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-400">
                      Online Collaborative
                    </span>{' '}
                    <span className="text-zinc-300">
                      Code <br />
                      Editor
                    </span>
                  </h1>
                  <p className="text-zinc-400 text-base lg:text-lg leading-relaxed">
                    Professional online collaborative editor for real-time code editing, pair programming, and team collaboration.
                  </p>
                  <p className="text-zinc-400 text-base lg:text-lg leading-relaxed">
                    <span className="text-zinc-200 font-bold">NO sign-up required</span> - start your collaborative coding session instantly.
                  </p>
                </div>

                {/* Demo Session Card */}
                <div className="bg-zinc-100 w-full h-[220px] overflow-auto scrollbar-hide lg:h-auto rounded-lg p-3 lg:p-4 shadow-sm border border-zinc-200 lg:mb-6 dark:bg-zinc-800 dark:border-zinc-700">
                  <h2 className="font-semibold mb-2 text-slate-900 text-base lg:text-lg dark:text-zinc-200">
                    Online Collaborative Code Editor Features
                  </h2>
                  <div className="space-y-3 text-sm text-slate-700 dark:text-zinc-300">
                    <div className="flex items-start space-x-2">
                      <Circle className="h-2 w-2 mt-2 text-orange-500 fill-current" />
                      <span>Instant collaborative coding sessions - no registration needed</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Circle className="h-2 w-2 mt-2 text-orange-500 fill-current" />
                      <span>Real-time pair programming with live cursor tracking</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Circle className="h-2 w-2 mt-2 text-orange-500 fill-current" />
                      <span>Professional code editor with syntax highlighting for 20+ languages</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Circle className="h-2 w-2 mt-2 text-orange-500 fill-current" />
                      <span>Free online collaborative editor for remote development teams</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                    <h3 className="font-medium mb-2 text-slate-900 dark:text-zinc-200">Features</h3>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded dark:bg-orange-900 dark:text-orange-200">Online editor</span>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">Collaborative coding</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded dark:bg-green-900 dark:text-green-200">Pair programming</span>
                      <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded dark:bg-purple-900 dark:text-purple-200">Real-time editing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Editor Preview */}
        <div className="relative lg:w-2/3 lg:pt-4 lg:pb-10 lg:pr-4 pb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 lg:from-slate-700 lg:via-slate-700 lg:to-slate-700 flex min-h-[500px] lg:min-h-screen">
          <div className="flex-1 px-4 lg:px-0">
            <div className="bg-zinc-100 w-full md:w-4/5 m-auto lg:w-full border rounded-lg shadow-2xl overflow-hidden h-full flex flex-col dark:bg-zinc-800">
              {/* Editor Header */}
              <div className="pr-4 lg:pr-6 pl-4 md:pl-12 h-12 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-700">
                <div className="flex items-center space-x-4">
                  <div className="text-zinc-600 dark:text-zinc-400 text-sm font-medium">
                    JavaScript
                  </div>
                  <div className="flex items-center space-x-2 text-zinc-600 dark:text-zinc-400">
                    <Users className="h-4 w-4" />
                    <span className="text-xs">Real-time collaboration</span>
                  </div>
                </div>
              </div>

              {/* Editor Content Preview */}
              <div className="flex-1 p-4 font-mono text-sm bg-[#1e1e1e] text-zinc-300 overflow-hidden">
                <div className="space-y-1">
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">1</span>
                    <span><span className="text-purple-400">function</span> <span className="text-blue-300">greet</span><span className="text-yellow-300">(</span><span className="text-orange-300">name</span><span className="text-yellow-300">)</span> <span className="text-yellow-300">{'{'}</span></span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">2</span>
                    <span className="ml-4 text-zinc-500">// This is a collaborative editor</span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">3</span>
                    <span className="ml-4 text-zinc-500">// Any changes you make are visible to others in real-time</span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">4</span>
                    <span className="ml-4"><span className="text-purple-400">return</span> <span className="text-green-300">`Welcome to kodecollab, ${'{'}{'{'}name{'}'}{'}'}`</span><span className="text-yellow-300">;</span></span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">5</span>
                    <span><span className="text-yellow-300">{'}'}</span></span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">6</span>
                    <span></span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">7</span>
                    <span className="text-zinc-500">// Try editing this code together with your team</span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">8</span>
                    <span><span className="text-purple-400">const</span> <span className="text-blue-300">message</span> <span className="text-yellow-300">=</span> <span className="text-blue-300">greet</span><span className="text-yellow-300">(</span><span className="text-green-300">'Team'</span><span className="text-yellow-300">);</span></span>
                  </div>
                  <div className="flex">
                    <span className="text-zinc-500 w-8 text-right mr-4">9</span>
                    <span><span className="text-blue-300">console</span><span className="text-yellow-300">.</span><span className="text-blue-300">log</span><span className="text-yellow-300">(</span><span className="text-orange-300">message</span><span className="text-yellow-300">);</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full lg:absolute bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 lg:from-transparent lg:via-transparent lg:to-transparent bottom-0 px-4 lg:px-6 pt-1 pb-2">
        <div className="flex justify-between items-center text-xs lg:text-sm text-slate-300">
          <span>
            © {new Date().getFullYear()} <BrandWordmark className="text-xs lg:text-sm font-semibold align-baseline" /> - Real-time Collaborative Code Editor
          </span>
          
          <div className="lg:flex items-center justify-center hidden">
            <div className="text-xs text-zinc-400">
              <span>Start collaborating instantly - No sign-up required</span>
            </div>
          </div>
        </div>
      </div>

      {/* Schema.org JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "kodecollab",
            "applicationCategory": "DeveloperApplication",
            "description": "Professional online collaborative code editor for real-time pair programming and team development. Free collaborative coding platform with instant sessions, syntax highlighting for 20+ languages, and live cursor tracking. No sign-up required.",
            "url": "https://kodecollab.com",
            "operatingSystem": "Any",
            "permissions": "No registration required",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "featureList": [
              "Online collaborative code editor",
              "Real-time pair programming",
              "Professional syntax highlighting for 20+ languages",
              "Instant collaborative coding sessions",
              "Live cursor tracking and user presence",
              "Free online editor with no registration"
            ],
            "keywords": "online collaborative editor, collaborative code editor, pair programming, real-time coding, online code editor, collaborative programming, free code editor, team coding, remote programming",
            "author": {
              "@type": "Organization",
              "name": "kodecollab team"
            }
          })
        }}
      />
    </div>
  );
} 

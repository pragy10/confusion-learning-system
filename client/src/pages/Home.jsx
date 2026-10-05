import { Link } from "react-router-dom";
import { BookOpen, Brain, GitBranch, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] py-16 px-4">
      <div className="max-w-3xl w-full text-center space-y-8">
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-50 leading-[1.1]">
          Understand difficult topics <br className="hidden sm:block" />
          <span className="text-slate-400">while you watch.</span>
        </h1>

        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          The Confusion Learning System uses local AI to provide instant explanations, architectural diagrams, and contextual notes the exact moment a video becomes unclear.
        </p>

        <div className="pt-4 pb-12 flex justify-center">
          <Link 
            to="/app" 
            className="group inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-slate-200 transition-colors"
          >
            Open Workspace
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left border-t border-slate-800/60 pt-16 mt-8">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-300">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="text-base font-medium text-slate-200">Local Transcripts</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Video audio is transcribed directly on your device, ensuring accurate and secure playback syncing.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-300">
              <Brain className="w-5 h-5" />
            </div>
            <h3 className="text-base font-medium text-slate-200">Contextual Tutors</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Signal confusion at any timestamp to receive a tailored explanation based on the surrounding context.
            </p>
          </div>

          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg border border-slate-800 bg-slate-900/50 flex items-center justify-center text-slate-300">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="text-base font-medium text-slate-200">Concept Diagrams</h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              Instantly generate visual relationship and architecture diagrams to map out complex ideas.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

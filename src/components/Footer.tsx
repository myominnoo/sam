import { ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="mt-12 border-t border-slate-200/80 bg-white/50 backdrop-blur-xs py-4 px-4 sm:px-6">
      <div className="max-w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
        {/* Left Side */}
        <div className="flex items-center gap-1.5 font-medium">
          <span>Visit</span>
          <a
            href="/"
            className="text-indigo-600 hover:text-indigo-700 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            Staff Allocation Matrix (SAM)
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Center */}
        <div className="text-center font-medium text-slate-600">
          © 2026 Myo Minn Oo. All rights reserved.
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-slate-100 border border-slate-200/80 text-slate-600 rounded-md font-mono text-[10px] font-semibold">
            v1.0
          </span>
        </div>
      </div>
    </footer>
  );
};

import { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[460px_1fr]">
      <aside className="hidden flex-col justify-between bg-[#201e1d] px-11 py-12 text-[#f3f2f2] lg:flex">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 bg-primary" />
            <span className="font-heading text-xl font-extrabold tracking-tight">CONFERA</span>
          </div>
          <div className="mb-8 mt-11 h-0.5 w-24 bg-primary" />
          <h1 className="text-[42px] font-extrabold leading-[1.06] tracking-tight text-[#f3f2f2]">
            Meetings that
            <br />
            write themselves
            <br />
            down.
          </h1>
          <p className="mt-6 max-w-[300px] text-[15px] leading-relaxed text-white/62">
            Video meetings and livestreams for your organization — with transcripts, summaries and action items
            generated the moment a call ends.
          </p>
        </div>
        <div className="flex flex-col gap-3.5">
          <div className="h-px bg-white/22" />
          <div className="grid grid-cols-3 gap-4 text-[11px] uppercase tracking-[0.08em] text-white/50">
            <span>Meetings</span>
            <span>Livestreams</span>
            <span>AI notes</span>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-16 lg:items-center lg:justify-start lg:px-16">
        <div className="w-full max-w-[400px]">{children}</div>
      </main>
    </div>
  );
}

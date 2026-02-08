import React from 'react';

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-dusk/80 p-5 shadow-lg shadow-black/40">
      <header className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      </header>
      {children}
    </section>
  );
}

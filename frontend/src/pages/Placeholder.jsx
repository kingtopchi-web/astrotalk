import React from 'react';
import Header from '../components/Header';
import BottomNav from '../components/BottomNav';

function Placeholder({ title }) {
  return (
    <div className="flex flex-col min-h-screen bg-surface">
      <Header />
      <main className="flex flex-col flex-1 pt-20 pb-24 px-4 items-center justify-center">
        <span className="material-symbols-outlined text-[64px] text-primary mb-4">construction</span>
        <h1 className="font-headline-md text-headline-md font-bold mb-2">{title} Page</h1>
        <p className="text-on-surface-variant text-center">
          This page is under construction. It will be implemented soon!
        </p>
      </main>
      <BottomNav />
    </div>
  );
}

export default Placeholder;

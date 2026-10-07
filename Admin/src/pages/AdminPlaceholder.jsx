import React from 'react';
import { Construction } from 'lucide-react';

/**
 * Reusable placeholder for admin pages under development.
 * Pass title, description, icon props to customize.
 */
export default function AdminPlaceholder({ title = 'Coming Soon', description = 'This section is under development and will be available soon.' }) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
          <Construction size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-700 mb-2">{title}</h2>
        <p className="text-sm text-slate-400 max-w-sm">{description}</p>
      </div>
    </div>
  );
}

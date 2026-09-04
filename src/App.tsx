import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { StudentResult } from './types';

export default function App() {
  const [data, setData] = useState<StudentResult[] | null>(null);

  const handleReset = () => {
    setData(null);
  };
  
  const handleAppendData = (newData: StudentResult[]) => {
    setData(prev => prev ? [...prev, ...newData] : newData);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 print:bg-white">
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            PAES <span className="text-indigo-600">Analyzer</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-hidden content-start max-w-7xl mx-auto w-full print:p-0 print:overflow-visible print:max-w-none">
        {!data ? (
          <FileUpload onDataLoaded={setData} />
        ) : (
          <Dashboard data={data} onReset={handleReset} onAppendData={handleAppendData} />
        )}
      </main>
    </div>
  );
}

import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import { StudentResult } from './types';

export default function App() {
  const [data, setData] = useState<StudentResult[] | null>(null);

  const handleReset = () => {
    setData(null);
  };
  
  const handleAppendData = (newData: StudentResult[]) => {
    setData(prev => prev ? [...prev, ...newData] : newData);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 print:bg-white">
      <header className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10 print:hidden">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center">
            <BookOpen size={20} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-800">
            PAES <span className="text-indigo-600">Analyzer</span>
          </h1>
        </div>
      </header>

      <main className="flex-1 p-8 overflow-hidden content-start max-w-7xl mx-auto w-full print:p-0 print:overflow-visible">
        {!data ? (
          <FileUpload onDataLoaded={setData} />
        ) : (
          <Dashboard data={data} onReset={handleReset} onAppendData={handleAppendData} />
        )}
      </main>
    </div>
  );
}


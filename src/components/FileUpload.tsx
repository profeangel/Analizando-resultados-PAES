import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { StudentResult } from '../types';
import { parseCSVs } from '../utils';

interface FileUploadProps {
  onDataLoaded: (data: StudentResult[]) => void;
}

export default function FileUpload({ onDataLoaded }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFiles = async (files: FileList | File[]) => {
    setError(null);
    try {
      const data = await parseCSVs(files);
      onDataLoaded(data);
    } catch (err: any) {
      setError(err.message || 'Hubo un error al procesar los archivos.');
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, []);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-12 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
      <div 
        className={`relative border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:border-slate-400'}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full mb-4">
          <UploadCloud size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">Sube tus resultados PAES</h3>
        <p className="text-slate-500 mb-6 max-w-sm text-sm">
          Arrastra y suelta uno o varios archivos CSV aquí, o haz clic para buscarlos.
        </p>
        
        <label className="cursor-pointer bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm hover:bg-indigo-700 transition-colors">
          Seleccionar Archivos
          <input 
            type="file" 
            multiple
            className="hidden" 
            accept=".csv"
            onChange={onFileChange}
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md border border-red-100 text-sm font-medium text-center">
          {error}
        </div>
      )}
    </div>
  );
}

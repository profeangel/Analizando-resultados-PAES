import React, { useState, useMemo, useRef } from 'react';
import { Search, Filter, ArrowUpRight, ArrowDownRight, Minus, FilePlus, Download, Printer, BookOpen, ChevronUp, ChevronDown, ChevronsUpDown, Info, Loader2, Copy } from 'lucide-react';
import { StudentResult } from '../types';
import { AverageScoresChart, ScoreDistributionChart, PerformancePieChart } from './Charts';
import StatisticalSummary from './StatisticalSummary';
import { parseCSVs } from '../utils';
import { scoreToNota } from '../scoreToGrade';
import { getClassification, SubjectType } from '../classification';
import { useReactToPrint } from 'react-to-print';

interface DashboardProps {
  data: StudentResult[];
  onReset: () => void;
  onAppendData: (data: StudentResult[]) => void;
}

type SortConfig = { key: string; direction: 'asc' | 'desc' } | null;

export default function Dashboard({ data, onReset, onAppendData }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [courseFilter, setCourseFilter] = useState('Todos');
  const [subjectFilter, setSubjectFilter] = useState('Todas');
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printComponentRef = useRef<HTMLDivElement>(null);

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        const newData = await parseCSVs(e.target.files);
        onAppendData(newData);
      } catch (err) {
        alert('Error al agregar archivos');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportPDF = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: 'Reporte_Resultados_PAES'
  });

  const handleCopyChart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const container = e.currentTarget.closest('.chart-wrapper');
    if (!container) return;
    
    // Buscar todos los SVGs dentro del contenedor, ignorando los íconos de los botones (lucide)
    const svgs = Array.from(container.querySelectorAll('svg:not(.lucide)')) as SVGSVGElement[];
    
    if (svgs.length === 0) {
      alert("No se encontró el gráfico para copiar.");
      return;
    }
    
    // Encontrar el SVG más grande por área (garantiza que copiemos el gráfico real y no un cuadrito de la leyenda)
    let svg = svgs[0];
    let maxArea = 0;
    svgs.forEach(s => {
      const rect = s.getBoundingClientRect();
      const area = rect.width * rect.height;
      if (area > maxArea) {
        maxArea = area;
        svg = s;
      }
    });
    
    try {
      const btn = e.currentTarget;
      const originalTitle = btn.title;
      btn.title = "Copiando...";
      
      const rect = svg.getBoundingClientRect();
      
      // Clonar el SVG para inyectarle estilos sin afectar la vista web
      const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('width', rect.width.toString());
      clonedSvg.setAttribute('height', rect.height.toString());
      
      // Inyectar estilos básicos para asegurar que el texto se vea bien (ya que las clases CSS de Tailwind se pierden al copiar el SVG puro)
      const style = document.createElement('style');
      style.innerHTML = `
        text { font-family: ui-sans-serif, system-ui, sans-serif; font-size: 14px; fill: #334155; }
        .recharts-cartesian-axis-tick-value { font-size: 12px; }
      `;
      clonedSvg.insertBefore(style, clonedSvg.firstChild);
      
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const scale = 2; // Alta resolución
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      
      img.onload = () => {
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        if (ctx) {
          ctx.scale(scale, scale);
          ctx.fillStyle = '#ffffff'; // Fondo blanco
          ctx.fillRect(0, 0, rect.width, rect.height);
          ctx.drawImage(img, 0, 0);
          
          canvas.toBlob((blob) => {
            if (blob) {
              navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
                .then(() => {
                  btn.title = "¡Copiado!";
                  setTimeout(() => btn.title = originalTitle, 2000);
                })
                .catch(() => alert('El navegador no soporta el pegado directo. Intenta descargar el PDF.'));
            }
          });
        }
        URL.revokeObjectURL(url);
      };
      
      img.src = url;
    } catch (err) {
      console.error(err);
      alert('Error al copiar el gráfico.');
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Merge and deduplicate data by RUT
  const mergedData = useMemo(() => {
    const grouped = new Map<string, StudentResult[]>();
    
    data.forEach(row => {
      const id = row.RUT || row['Nombre del Estudiante'];
      if (!id) return;
      if (!grouped.has(id)) {
        grouped.set(id, []);
      }
      grouped.get(id)!.push(row);
    });

    const result: StudentResult[] = [];
    grouped.forEach(records => {
      // Sort chronologically (assuming uploadTimestamp is set during parsing)
      // Fallback to array index if uploadTimestamp is missing
      records.sort((a, b) => (a.uploadTimestamp ?? 0) - (b.uploadTimestamp ?? 0));
      
      const latest = { ...records[records.length - 1] };
      
      if (records.length > 1) {
        // Find the previous record that had actual scores
        for (let i = records.length - 2; i >= 0; i--) {
          const prev = records[i];
          if (latest.prevLengPuntaje === undefined && prev['Leng. Puntaje'] !== null) {
            latest.prevLengPuntaje = prev['Leng. Puntaje'];
          }
          if (latest.prevMatPuntaje === undefined && prev['Mat. Puntaje'] !== null) {
            latest.prevMatPuntaje = prev['Mat. Puntaje'];
          }
        }
      }
      
      result.push(latest);
    });
    
    return result;
  }, [data]);

  // Extract unique courses for the filter dropdown
  const courses = useMemo(() => {
    const unique = new Set(mergedData.map(d => d.Curso).filter(Boolean));
    return ['Todos', ...Array.from(unique)].sort();
  }, [mergedData]);

  // Calculate dynamic extra columns
  const extraColumns = useMemo(() => {
    const keys = new Set<string>();
    mergedData.forEach(row => Object.keys(row).forEach(k => keys.add(k)));
    const exclude = ['Curso', 'Nombre del Estudiante', 'RUT', 'Leng. Puntaje', 'Mat. Puntaje', 'uploadTimestamp', 'prevLengPuntaje', 'prevMatPuntaje', 'Nota Lenguaje', 'Nota Matemáticas'];
    return Array.from(keys).filter(k => !exclude.includes(k)).sort();
  }, [mergedData]);

  // Apply filters
  const filteredData = useMemo(() => {
    return mergedData.filter(student => {
      const matchesSearch = 
        (student['Nombre del Estudiante']?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (student.RUT?.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCourse = courseFilter === 'Todos' || student.Curso === courseFilter;
      
      return matchesSearch && matchesCourse;
    });
  }, [mergedData, searchTerm, courseFilter]);

  // Apply sorting
  const sortedData = useMemo(() => {
    let sortable = [...filteredData];
    
    // Add computed Nota fields for sorting if needed
    sortable = sortable.map(s => ({
      ...s,
      'Nota Lenguaje': scoreToNota(s['Leng. Puntaje']),
      'Nota Matemáticas': scoreToNota(s['Mat. Puntaje'])
    }));

    if (sortConfig !== null) {
      sortable.sort((a, b) => {
        let valA = (a as any)[sortConfig.key];
        let valB = (b as any)[sortConfig.key];
        
        if (valA === null || valA === undefined || valA === '-') valA = '';
        if (valB === null || valB === undefined || valB === '-') valB = '';
        
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredData, sortConfig]);

  // Calculate top-level stats based on filtered data
  const stats = useMemo(() => {
    let langTotal = 0, langCount = 0;
    let mathTotal = 0, mathCount = 0;

    filteredData.forEach(s => {
      if (s['Leng. Puntaje'] !== null) {
        langTotal += s['Leng. Puntaje'];
        langCount++;
      }
      if (s['Mat. Puntaje'] !== null) {
        mathTotal += s['Mat. Puntaje'];
        mathCount++;
      }
    });

    return {
      totalStudents: filteredData.length,
      avgLang: langCount > 0 ? Math.round(langTotal / langCount) : 0,
      avgMath: mathCount > 0 ? Math.round(mathTotal / mathCount) : 0,
    };
  }, [filteredData]);

  const getScoreBadge = (score: number | null, subject: SubjectType) => {
    const cls = getClassification(score, subject);
    if (cls.level === '-') return <span>-</span>;
    return <span className={`${cls.color} px-2 py-1 rounded text-[10px] font-bold`}>{cls.level}</span>;
  };

  const renderSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return <ChevronsUpDown size={14} className="text-slate-300 ml-1 inline" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} className="text-indigo-600 ml-1 inline" /> 
      : <ChevronDown size={14} className="text-indigo-600 ml-1 inline" />;
  };

  const renderScoreDelta = (current: number | null | undefined, previous: number | null | undefined) => {
    if (current == null || previous == null) return null;
    const delta = current - previous;
    if (delta === 0) return null;
    
    const isPositive = delta > 0;
    return (
      <span 
        title={`Variación respecto a la prueba anterior (${previous} pts)`}
        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 ${isPositive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
        {isPositive ? '+' : ''}{delta}
      </span>
    );
  };

  const showLang = subjectFilter === 'Todas' || subjectFilter === 'Lenguaje';
  const showMath = subjectFilter === 'Todas' || subjectFilter === 'Matemáticas';

  return (
    <div className="space-y-6">
      {/* Filters and Header Actions */}
      <div className="bg-white border-b border-slate-200 px-8 py-3 flex flex-col md:flex-row items-start md:items-center justify-between -mt-8 -mx-8 mb-8 print:hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 w-full md:w-auto mb-4 md:mb-0">
          <div className="relative w-full md:w-auto">
            <input
              type="text"
              placeholder="Buscar estudiante o RUT..."
              className="w-full md:w-64 pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              <select
                className="text-sm border-none bg-transparent font-medium text-slate-600 focus:outline-none cursor-pointer"
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                {courses.map(c => (
                  <option key={c} value={c}>{c === 'Todos' ? 'Todos los cursos' : c}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-slate-400" />
              <select
                className="text-sm border-none bg-transparent font-medium text-slate-600 focus:outline-none cursor-pointer"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="Todas">Todas las asignaturas</option>
                <option value="Lenguaje">Lenguaje</option>
                <option value="Matemáticas">Matemáticas</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => handleExportPDF()}
            title="Abre el diálogo de impresión. Asegúrate de seleccionar 'Guardar como PDF' como destino."
            className="flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-md text-sm font-semibold border border-slate-200 hover:bg-slate-200 transition-colors"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md text-sm font-semibold border border-indigo-100 hover:bg-indigo-100 transition-colors"
          >
            <FilePlus size={16} /> Agregar CSV
            <input 
              type="file" 
              multiple
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleAddFiles}
            />
          </button>
          <button 
            onClick={onReset}
            className="bg-white text-rose-600 px-3 py-1.5 rounded-md text-sm font-semibold border border-rose-100 hover:bg-rose-50 transition-colors"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div ref={printComponentRef} className="space-y-6 pb-8 print:p-8">
        <div className="print:block hidden mb-6">
          <h2 className="text-3xl font-bold text-slate-800">Reporte de Resultados PAES</h2>
          <p className="text-slate-500 mt-2 text-lg">Filtro aplicado: {courseFilter === 'Todos' ? 'Todos los cursos' : courseFilter} | Asignatura: {subjectFilter}</p>
        </div>

        <StatisticalSummary data={filteredData} subjectFilter={subjectFilter} courseFilter={courseFilter} />

        <div className="flex items-center gap-2 mb-4 print:hidden">
          <h2 className="text-lg font-bold text-slate-800">Métricas Generales</h2>
        <div className="relative group flex items-center">
          <Info size={16} className="text-slate-400 cursor-help" />
          <div className="absolute left-0 top-6 w-96 p-4 bg-slate-800 text-slate-100 text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
            <p className="font-bold mb-2 text-sm text-white">Criterios de Clasificación PAES</p>
            <div className="mb-3">
              <p className="font-bold text-indigo-300">Competencia Lectora</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li><span className="text-rose-400">Bajo (100-457):</span> Deficitario. No cumple umbral mínimo legal.</li>
                <li><span className="text-amber-400">Medio-Bajo (458-600):</span> Rango poblacional masivo. Habilita postulación.</li>
                <li><span className="text-indigo-400">Medio-Alto (601-750):</span> Altamente competitivo. Ingreso a humanidades/sociales.</li>
                <li><span className="text-emerald-400">Alto (751-1000):</span> Élite nacional. Rendimiento infrecuente.</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-indigo-300">Competencia Matemática 1 (M1)</p>
              <ul className="list-disc pl-4 mt-1 space-y-1">
                <li><span className="text-rose-400">Bajo (100-457):</span> Deficitario. Bloquea postulación al sistema.</li>
                <li><span className="text-amber-400">Medio-Bajo (458-650):</span> Rango base.</li>
                <li><span className="text-indigo-400">Medio-Alto (651-800):</span> Competitivo estándar. Piso para STEM.</li>
                <li><span className="text-emerald-400">Alto (801-1000):</span> Alta selectividad masificada (Medicina/Ingenierías).</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:flex print:flex-col print:gap-8 print:mb-12">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-base print:text-slate-500">Total Estudiantes</p>
          <h2 className="text-3xl font-bold text-slate-800 print:text-5xl">{stats.totalStudents}</h2>
          <p className="text-xs text-slate-500 mt-2 print:text-base">Registros procesados</p>
        </div>
        
        {showLang && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-base print:text-slate-500">Promedio Lenguaje</p>
            <h2 className="text-3xl font-bold text-slate-800 print:text-5xl">{stats.avgLang}</h2>
          </div>
        )}

        {showMath && (
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 print:text-base print:text-slate-500">Promedio Matemáticas</p>
            <h2 className="text-3xl font-bold text-slate-800 print:text-5xl">{stats.avgMath}</h2>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:block print:space-y-16">
        <div className="chart-wrapper group relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:break-inside-avoid print-page-break">
          <button onClick={handleCopyChart} title="Copiar como imagen" className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-indigo-600 print:hidden z-10">
            <Copy size={16} />
          </button>
          <h3 className="font-bold text-slate-800 mb-6 print:text-2xl border-b pb-2 print:border-slate-300">Promedios por Curso</h3>
          <AverageScoresChart data={filteredData} subjectFilter={subjectFilter} />
        </div>
        
        {subjectFilter === 'Todas' ? (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:break-inside-avoid print:flex-col md:flex-row gap-6 print-page-break">
            <div className="chart-wrapper group relative flex-1 print:mb-10">
              <button onClick={handleCopyChart} title="Copiar como imagen" className="absolute top-0 right-0 p-2 bg-slate-50 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-indigo-600 print:hidden z-10">
                <Copy size={16} />
              </button>
              <h3 className="font-bold text-slate-800 mb-6 text-center print:text-2xl border-b pb-2 print:border-slate-300">Niveles Lenguaje</h3>
              <PerformancePieChart data={filteredData} subjectFilter="Lenguaje" />
            </div>
            <div className="hidden md:block w-px bg-slate-200 my-4 print:hidden"></div>
            <div className="chart-wrapper group relative flex-1">
              <button onClick={handleCopyChart} title="Copiar como imagen" className="absolute top-0 right-0 p-2 bg-slate-50 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-indigo-600 print:hidden z-10">
                <Copy size={16} />
              </button>
              <h3 className="font-bold text-slate-800 mb-6 text-center print:text-2xl border-b pb-2 print:border-slate-300">Niveles Matemáticas</h3>
              <PerformancePieChart data={filteredData} subjectFilter="Matemáticas" />
            </div>
          </div>
        ) : (
          <div className="chart-wrapper group relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:shadow-none print:border-none print:p-0 print:break-inside-avoid print-page-break">
            <button onClick={handleCopyChart} title="Copiar como imagen" className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-indigo-600 print:hidden z-10">
              <Copy size={16} />
            </button>
            <h3 className="font-bold text-slate-800 mb-6 print:text-2xl border-b pb-2 print:border-slate-300">Niveles de Desempeño ({subjectFilter})</h3>
            <PerformancePieChart data={filteredData} subjectFilter={subjectFilter} />
          </div>
        )}

        {showLang && (
          <div className="chart-wrapper group relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 print:shadow-none print:border-none print:p-0 print:break-inside-avoid print-page-break">
            <button onClick={handleCopyChart} title="Copiar como imagen" className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-indigo-600 print:hidden z-10">
              <Copy size={16} />
            </button>
            <h3 className="font-bold text-slate-800 mb-6 print:text-2xl border-b pb-2 print:border-slate-300">Distribución Lenguaje</h3>
            <ScoreDistributionChart data={filteredData} subject="Leng. Puntaje" />
          </div>
        )}

        {showMath && (
          <div className="chart-wrapper group relative bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2 print:shadow-none print:border-none print:p-0 print:break-inside-avoid print-page-break">
            <button onClick={handleCopyChart} title="Copiar como imagen" className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 hover:text-indigo-600 print:hidden z-10">
              <Copy size={16} />
            </button>
            <h3 className="font-bold text-slate-800 mb-6 print:text-2xl border-b pb-2 print:border-slate-300">Distribución Matemáticas</h3>
            <ScoreDistributionChart data={filteredData} subject="Mat. Puntaje" />
          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6 print:shadow-none print:border-none print:mt-16 print-page-break">
        <div className="p-5 border-b border-slate-200 flex justify-between items-center print:border-b-4 print:p-0 print:pb-4 print:mb-6">
          <h3 className="font-bold text-slate-800 print:text-2xl">Resultados Detallados</h3>
          <div className="text-xs text-slate-500 font-medium print:text-base">Mostrando {sortedData.length} registros</div>
        </div>
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 print:bg-white select-none">
                <th className="px-4 py-3 font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('Curso')}>
                  Curso {renderSortIcon('Curso')}
                </th>
                <th className="px-4 py-3 font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('Nombre del Estudiante')}>
                  Estudiante {renderSortIcon('Nombre del Estudiante')}
                </th>
                <th className="px-4 py-3 font-bold text-slate-600 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('RUT')}>
                  RUT {renderSortIcon('RUT')}
                </th>
                
                {showLang && (
                  <>
                    <th className="px-4 py-3 font-bold text-slate-600 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('Leng. Puntaje')}>
                      Ptje. Lenguaje {renderSortIcon('Leng. Puntaje')}
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('Nota Lenguaje')}>
                      Nota Leng {renderSortIcon('Nota Lenguaje')}
                    </th>
                  </>
                )}
                
                {showMath && (
                  <>
                    <th className="px-4 py-3 font-bold text-slate-600 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('Mat. Puntaje')}>
                      Ptje. Mate {renderSortIcon('Mat. Puntaje')}
                    </th>
                    <th className="px-4 py-3 font-bold text-slate-600 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('Nota Matemáticas')}>
                      Nota Mate {renderSortIcon('Nota Matemáticas')}
                    </th>
                  </>
                )}

                {extraColumns.map(col => (
                  <th key={col} className="px-4 py-3 font-bold text-slate-500 text-center text-xs cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort(col)}>
                    {col} {renderSortIcon(col)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 print:divide-slate-200">
              {sortedData.map((student, i) => {
                // @ts-ignore
                const notaLeng = student['Nota Lenguaje'];
                // @ts-ignore
                const notaMate = student['Nota Matemáticas'];

                return (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors print:break-inside-avoid">
                    <td className="px-4 py-3 font-medium text-slate-800">{student.Curso}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{student['Nombre del Estudiante']}</td>
                    <td className="px-4 py-3 text-slate-500 text-center text-xs">{student.RUT}</td>
                    
                    {showLang && (
                      <>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center">
                              <span className="font-bold text-indigo-700">{student['Leng. Puntaje'] ?? '-'}</span>
                              {renderScoreDelta(student['Leng. Puntaje'], student.prevLengPuntaje)}
                            </div>
                            {getScoreBadge(student['Leng. Puntaje'], 'Leng. Puntaje')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-slate-700">
                          {notaLeng}
                        </td>
                      </>
                    )}

                    {showMath && (
                      <>
                        <td className="px-4 py-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center justify-center">
                              <span className="font-bold text-indigo-700">{student['Mat. Puntaje'] ?? '-'}</span>
                              {renderScoreDelta(student['Mat. Puntaje'], student.prevMatPuntaje)}
                            </div>
                            {getScoreBadge(student['Mat. Puntaje'], 'Mat. Puntaje')}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center font-medium text-slate-700">
                          {notaMate}
                        </td>
                      </>
                    )}

                    {extraColumns.map(col => (
                      <td key={col} className="px-4 py-3 text-center text-xs text-slate-600">
                        {student[col] ?? '-'}
                      </td>
                    ))}
                  </tr>
                );
              })}
              {sortedData.length === 0 && (
                <tr>
                  <td colSpan={5 + extraColumns.length + (showLang && showMath ? 2 : 0)} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron resultados para los filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}

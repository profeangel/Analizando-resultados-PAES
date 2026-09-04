import React, { useState } from 'react';
import { StudentResult } from '../types';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';

interface StatsProps {
  data: StudentResult[];
  subjectFilter: string;
  courseFilter: string;
}

function calculateBasicStats(scores: number[]) {
  if (scores.length === 0) return { n: 0, mean: 0, sd: 0 };
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
  const sd = Math.sqrt(variance);
  return {
    n: scores.length,
    mean: Math.round(mean),
    sd: Math.round(sd)
  };
}

export default function StatisticalSummary({ data, subjectFilter, courseFilter }: StatsProps) {
  const [expanded, setExpanded] = useState(false);

  const subjects = subjectFilter === 'Todas' 
    ? [{ key: 'Leng. Puntaje', name: 'Lenguaje' }, { key: 'Mat. Puntaje', name: 'Matemáticas' }]
    : subjectFilter === 'Lenguaje'
      ? [{ key: 'Leng. Puntaje', name: 'Lenguaje' }]
      : [{ key: 'Mat. Puntaje', name: 'Matemáticas' }];

  return (
    <div className="bg-indigo-50 border border-indigo-100 rounded-xl mb-6 overflow-hidden print:border-none print:bg-white print:mb-8">
      <button 
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 bg-indigo-100/50 hover:bg-indigo-100 transition-colors print:hidden"
      >
        <div className="flex items-center gap-2 text-indigo-800 font-bold">
          <FileText size={18} />
          <span>Resumen de Resultados</span>
        </div>
        {expanded ? <ChevronUp size={20} className="text-indigo-600" /> : <ChevronDown size={20} className="text-indigo-600" />}
      </button>
      
      <div className={`${expanded ? 'block' : 'hidden'} print:block p-5 md:p-6 space-y-8 text-slate-700 leading-relaxed text-sm md:text-base`}>
        {subjects.map(subj => {
          const scores = data.map(d => d[subj.key as keyof StudentResult] as number).filter(v => v !== null && v !== undefined);
          const generalStats = calculateBasicStats(scores);
          
          if (generalStats.n === 0) return null;

          const courseStats = [];
          if (courseFilter === 'Todos') {
            const courses = Array.from(new Set(data.map(d => d.Curso).filter(Boolean))).sort();
            for (const course of courses) {
              const cScores = data.filter(d => d.Curso === course).map(d => d[subj.key as keyof StudentResult] as number).filter(v => v !== null && v !== undefined);
              if (cScores.length > 0) {
                courseStats.push({ name: course, ...calculateBasicStats(cScores) });
              }
            }
          }

          return (
            <div key={subj.key} className="space-y-3">
              <h4 className="font-bold text-lg text-indigo-900 border-b border-indigo-200 pb-1">Análisis de {subj.name}</h4>
              <p>
                En la asignatura de <strong>{subj.name}</strong>, evaluamos a un total de <strong>{generalStats.n} estudiantes</strong>. 
                El puntaje promedio general alcanzado fue de <strong>{generalStats.mean} puntos</strong>.
              </p>
              <p>
                La dispersión de los puntajes (conocida como desviación estándar) es de <strong>{generalStats.sd} puntos</strong>. 
                En términos sencillos, esto significa que la gran mayoría de los estudiantes (alrededor del 68%) obtuvo puntajes que se ubican 
                entre los <strong>{Math.max(100, generalStats.mean - generalStats.sd)}</strong> y <strong>{Math.min(1000, generalStats.mean + generalStats.sd)}</strong> puntos. 
                {generalStats.sd > 100 
                  ? ' Al ser un número de dispersión superior a 100, notamos que hay una diferencia de rendimiento importante entre los estudiantes con mejores y peores resultados (el grupo es muy heterogéneo).' 
                  : ' Al ser un número de dispersión bajo, notamos que el grupo tuvo un rendimiento bastante parejo, sin tantas diferencias extremas (el grupo es homogéneo).'}
              </p>
              
              {courseStats.length > 0 && (
                <div className="mt-4 bg-white/60 p-4 rounded-lg border border-indigo-100 print:bg-slate-50 print:border-slate-200">
                  <p className="font-semibold mb-2 text-indigo-900">Desglose por curso:</p>
                  <ul className="list-disc pl-5 space-y-2">
                    {courseStats.map(cs => (
                      <li key={cs.name}>
                        El curso <strong>{cs.name}</strong> ({cs.n} estudiantes) obtuvo un promedio de <strong>{cs.mean} puntos</strong>, 
                        con una dispersión de {cs.sd} puntos.
                        {cs.mean > generalStats.mean + 10 ? ' (Destaca positivamente sobre la media general).' : cs.mean < generalStats.mean - 10 ? ' (Rendimiento bajo la media general).' : ' (Rendimiento muy similar a la media general).'}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type SubjectType = 'Leng. Puntaje' | 'Mat. Puntaje';

export interface Classification {
  level: string;
  color: string;
  hex: string;
}

export const getClassification = (score: number | null | undefined, subject: SubjectType): Classification => {
  if (score === null || score === undefined) return { level: '-', color: 'bg-slate-100 text-slate-700', hex: '#cbd5e1' };

  if (subject === 'Leng. Puntaje') {
    if (score <= 457) return { level: 'BAJO', color: 'bg-rose-50 text-rose-700', hex: '#f43f5e' };
    if (score <= 600) return { level: 'MEDIO-BAJO', color: 'bg-amber-50 text-amber-700', hex: '#f59e0b' };
    if (score <= 750) return { level: 'MEDIO-ALTO', color: 'bg-indigo-50 text-indigo-700', hex: '#6366f1' };
    return { level: 'ALTO', color: 'bg-emerald-50 text-emerald-700', hex: '#10b981' };
  } else {
    if (score <= 457) return { level: 'BAJO', color: 'bg-rose-50 text-rose-700', hex: '#f43f5e' };
    if (score <= 650) return { level: 'MEDIO-BAJO', color: 'bg-amber-50 text-amber-700', hex: '#f59e0b' };
    if (score <= 800) return { level: 'MEDIO-ALTO', color: 'bg-indigo-50 text-indigo-700', hex: '#6366f1' };
    return { level: 'ALTO', color: 'bg-emerald-50 text-emerald-700', hex: '#10b981' };
  }
};

import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LabelList, AreaChart, Area
} from 'recharts';
import { StudentResult } from '../types';
import { getClassification, SubjectType } from '../classification';

interface ChartsProps {
  data: StudentResult[];
  subjectFilter?: string;
}

export function AverageScoresChart({ data, subjectFilter = 'Todas' }: ChartsProps) {
  const chartData = useMemo(() => {
    const courseMap = new Map<string, {
      course: string;
      langTotal: number;
      langCount: number;
      mathTotal: number;
      mathCount: number;
    }>();

    data.forEach(student => {
      if (!student.Curso) return;
      
      if (!courseMap.has(student.Curso)) {
        courseMap.set(student.Curso, { course: student.Curso, langTotal: 0, langCount: 0, mathTotal: 0, mathCount: 0 });
      }
      
      const courseData = courseMap.get(student.Curso)!;
      
      if (student['Leng. Puntaje'] !== null) {
        courseData.langTotal += student['Leng. Puntaje'];
        courseData.langCount++;
      }
      
      if (student['Mat. Puntaje'] !== null) {
        courseData.mathTotal += student['Mat. Puntaje'];
        courseData.mathCount++;
      }
    });

    return Array.from(courseMap.values()).map(c => ({
      name: c.course,
      Lenguaje: c.langCount > 0 ? Math.round(c.langTotal / c.langCount) : 0,
      Matemáticas: c.mathCount > 0 ? Math.round(c.mathTotal / c.mathCount) : 0,
    })).sort((a, b) => a.name.localeCompare(b.name));
  }, [data]);

  if (chartData.length === 0) {
    return <div className="text-slate-500 text-center py-12">No hay datos suficientes para el gráfico.</div>;
  }

  const showLang = subjectFilter === 'Todas' || subjectFilter === 'Lenguaje';
  const showMath = subjectFilter === 'Todas' || subjectFilter === 'Matemáticas';

  return (
    <div className="h-72 w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="name" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
          <YAxis tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
          <RechartsTooltip 
            cursor={{fill: '#f8fafc'}}
            contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}}
          />
          <Legend wrapperStyle={{paddingTop: '20px', fontSize: '12px'}} />
          {showLang && (
            <Bar dataKey="Lenguaje" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40}>
              <LabelList dataKey="Lenguaje" position="top" style={{fill: '#64748b', fontSize: 10}} formatter={(val: number) => val > 0 ? val : ''} />
            </Bar>
          )}
          {showMath && (
            <Bar dataKey="Matemáticas" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40}>
              <LabelList dataKey="Matemáticas" position="top" style={{fill: '#64748b', fontSize: 10}} formatter={(val: number) => val > 0 ? val : ''} />
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PerformancePieChart({ data, subjectFilter }: ChartsProps) {
  const isMath = subjectFilter === 'Matemáticas';
  const ranges = isMath 
    ? ['< 458', '458 - 650', '651 - 800', '> 800'] 
    : ['< 458', '458 - 600', '601 - 750', '> 750'];

  const pieData = useMemo(() => {
    let bajo = 0, medioBajo = 0, medioAlto = 0, alto = 0;
    
    data.forEach(s => {
      const subjKey = isMath ? 'Mat. Puntaje' : 'Leng. Puntaje';
      const processScore = (score: number | null, subject: SubjectType) => {
        if (score === null) return;
        const cls = getClassification(score, subject);
        if (cls.level === 'BAJO') bajo++;
        else if (cls.level === 'MEDIO-BAJO') medioBajo++;
        else if (cls.level === 'MEDIO-ALTO') medioAlto++;
        else if (cls.level === 'ALTO') alto++;
      };
      
      processScore(s[subjKey], subjKey);
    });
    
    return [
      { name: `Bajo (${ranges[0]})`, value: bajo, color: '#f43f5e' },
      { name: `Medio-Bajo (${ranges[1]})`, value: medioBajo, color: '#f59e0b' },
      { name: `Medio-Alto (${ranges[2]})`, value: medioAlto, color: '#6366f1' },
      { name: `Alto (${ranges[3]})`, value: alto, color: '#10b981' },
    ];
  }, [data, isMath, ranges]);

  if (pieData.every(d => d.value === 0)) {
    return <div className="text-slate-500 text-center py-12">No hay datos suficientes para el gráfico.</div>;
  }

  return (
    <div className="h-72 w-full mt-4 flex justify-center items-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent, value }) => percent > 0 ? `${(percent * 100).toFixed(0)}% (${value})` : ''}
            labelLine={false}
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip 
            contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreDistributionChart({ data, subject }: { data: StudentResult[], subject: SubjectType }) {
  const chartData = useMemo(() => {
    const bins = [];
    for (let i = 100; i < 1000; i += 25) {
      bins.push({ center: i + 12.5, count: 0, min: i, max: i + 24.99 });
    }

    data.forEach(student => {
      const score = student[subject];
      if (score !== null && score !== undefined) {
        const bin = bins.find(b => score >= b.min && score <= b.max);
        if (bin) {
          bin.count++;
        }
      }
    });
    return bins;
  }, [data, subject]);

  const isMath = subject === 'Mat. Puntaje';
  const name = isMath ? 'Estudiantes (Matemáticas)' : 'Estudiantes (Lenguaje)';
  const gradientId = `colorGrad-${subject.replace(/[^a-zA-Z]/g, '')}`;

  const stops = isMath ? [
    { offset: '39.67%', color: '#f43f5e' },
    { offset: '61.11%', color: '#f59e0b' },
    { offset: '77.78%', color: '#6366f1' },
    { offset: '100%', color: '#10b981' }
  ] : [
    { offset: '39.67%', color: '#f43f5e' },
    { offset: '55.56%', color: '#f59e0b' },
    { offset: '72.22%', color: '#6366f1' },
    { offset: '100%', color: '#10b981' }
  ];

  const totals = useMemo(() => {
    let b = 0, mb = 0, ma = 0, a = 0;
    data.forEach(s => {
      const sc = s[subject];
      if (sc !== null && sc !== undefined) {
        const cls = getClassification(sc, subject);
        if (cls.level === 'BAJO') b++;
        else if (cls.level === 'MEDIO-BAJO') mb++;
        else if (cls.level === 'MEDIO-ALTO') ma++;
        else if (cls.level === 'ALTO') a++;
      }
    });
    return { b, mb, ma, a };
  }, [data, subject]);

  return (
    <div className="w-full flex flex-col">
      <div className="flex flex-wrap justify-between items-center gap-2 text-[11px] font-bold mb-4 print:text-[10px]">
        <div className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100 flex-1 text-center whitespace-nowrap">Bajo: {totals.b}</div>
        <div className="text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 flex-1 text-center whitespace-nowrap">Medio-Bajo: {totals.mb}</div>
        <div className="text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100 flex-1 text-center whitespace-nowrap">Medio-Alto: {totals.ma}</div>
        <div className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex-1 text-center whitespace-nowrap">Alto: {totals.a}</div>
      </div>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={stops[0].color} stopOpacity={0.8}/>
                <stop offset={stops[0].offset} stopColor={stops[0].color} stopOpacity={0.8}/>
                
                <stop offset={stops[0].offset} stopColor={stops[1].color} stopOpacity={0.8}/>
                <stop offset={stops[1].offset} stopColor={stops[1].color} stopOpacity={0.8}/>
                
                <stop offset={stops[1].offset} stopColor={stops[2].color} stopOpacity={0.8}/>
                <stop offset={stops[2].offset} stopColor={stops[2].color} stopOpacity={0.8}/>
                
                <stop offset={stops[2].offset} stopColor={stops[3].color} stopOpacity={0.8}/>
                <stop offset={stops[3].offset} stopColor={stops[3].color} stopOpacity={0.8}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="center" 
              type="number"
              domain={[100, 1000]}
              ticks={[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]}
              tick={{fill: '#64748b', fontSize: 11}} 
              axisLine={false} 
              tickLine={false} 
            />
            <YAxis tick={{fill: '#64748b', fontSize: 11}} axisLine={false} tickLine={false} allowDecimals={false} />
            <RechartsTooltip 
              labelFormatter={(val) => `Puntaje: ~${Math.round(val as number)}`}
              contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'}}
            />
            <Area 
              type="monotone" 
              dataKey="count" 
              name={name}
              stroke={`url(#${gradientId})`} 
              fill={`url(#${gradientId})`} 
              strokeWidth={2}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

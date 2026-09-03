import Papa from 'papaparse';
import { StudentResult } from './types';

export const parseCSVs = async (files: FileList | File[]): Promise<StudentResult[]> => {
  const fileArray = Array.from(files).filter(f => f.type === 'text/csv' || f.name.endsWith('.csv'));
  if (fileArray.length === 0) {
    throw new Error('Por favor sube al menos un archivo CSV válido.');
  }

  const allResults = await Promise.all(fileArray.map((file, fileIndex) => {
    return new Promise<StudentResult[]>((resolve, reject) => {
      const uploadTimestamp = Date.now() + fileIndex;
      Papa.parse<any>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            reject(new Error(`Error en archivo ${file.name}`));
            return;
          }
          const parsedData = results.data.map((row: any) => {
            const processedRow: StudentResult = {
              Curso: row.Curso || '',
              'Nombre del Estudiante': row['Nombre del Estudiante'] || '',
              RUT: row.RUT || '',
              'Leng. Puntaje': row['Leng. Puntaje'] ? Number(row['Leng. Puntaje']) : null,
              'Mat. Puntaje': row['Mat. Puntaje'] ? Number(row['Mat. Puntaje']) : null,
              uploadTimestamp,
            };
            Object.keys(row).forEach(key => {
              if (key !== 'Curso' && key !== 'Nombre del Estudiante' && key !== 'RUT' && key !== 'Leng. Puntaje' && key !== 'Mat. Puntaje') {
                const val = row[key];
                if (val !== undefined && val !== null && val !== '') {
                  const num = Number(val);
                  processedRow[key] = !isNaN(num) ? num : val;
                } else {
                  processedRow[key] = null;
                }
              }
            });
            return processedRow;
          });
          resolve(parsedData);
        },
        error: (err) => reject(err)
      });
    });
  }));
  
  return allResults.flat();
};

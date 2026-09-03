export interface StudentResult {
  Curso: string;
  'Nombre del Estudiante': string;
  RUT: string;
  'Leng. Puntaje': number | null;
  'Mat. Puntaje': number | null;
  uploadTimestamp?: number;
  prevLengPuntaje?: number | null;
  prevMatPuntaje?: number | null;
  [key: string]: string | number | null | undefined;
}

export interface PaesDataRow {
  [key: string]: string | number | undefined;
}

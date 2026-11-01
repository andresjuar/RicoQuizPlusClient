/** Respuesta paginada de la API: GET /quizzes, /quizzes/mine, /matches/user/:id */
export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
}

/** Cuerpo de error que regresa errorMiddleware: { message, errores? } */
export interface ApiErrorBody {
  message: string;
  errores?: string[];
}

/** Error ya normalizado que reciben los componentes (lo crea el interceptor de #33). */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly details: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
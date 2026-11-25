import { Injectable } from '@angular/core';

const KEY = 'rq_answer';

interface StoredAnswer {
  roomCode: string;
  questionIndex: number;
  answerIndex: number;
}

/**
 * Guarda en sessionStorage la respuesta de la pregunta ACTUAL.
 *
 * Al reconectarse (p. ej. recargar la página), el servidor solo dice `alreadyAnswered: true`,
 * no qué opción se eligió; sin esto, el reveal diría "Respuesta incorrecta" aunque hubieras acertado.
 *
 * Solo hay una entrada a la vez y GameRoom la borra en cada pregunta nueva, al terminar la partida,
 * al jugar de nuevo y al salir de la sala, así que no queda nada guardado después de jugar.
 * sessionStorage (y no localStorage) para que tampoco sobreviva a cerrar la pestaña.
 */
@Injectable({ providedIn: 'root' })
export class AnswerStorageService {
  save(roomCode: string, questionIndex: number, answerIndex: number): void {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ roomCode, questionIndex, answerIndex } satisfies StoredAnswer));
    } catch {
      // Modo privado o almacenamiento lleno: solo se pierde la recuperación tras recargar
    }
  }

  /** Índice guardado para esa sala y pregunta, o null si no hay o es de otra */
  get(roomCode: string, questionIndex: number): number | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (!raw) return null;
      const stored = JSON.parse(raw) as StoredAnswer;
      return stored.roomCode === roomCode && stored.questionIndex === questionIndex ? stored.answerIndex : null;
    } catch {
      return null;
    }
  }

  clear(): void {
    try {
      sessionStorage.removeItem(KEY);
    } catch {
      // nada que limpiar
    }
  }
}

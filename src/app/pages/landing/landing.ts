import { Component, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { map } from 'rxjs'
import { AuthService } from '../../shared/services/auth.service'
import { QuizService } from '../../shared/services/quiz.service'
import { MatchService } from '../../shared/services/match.service'
import { ToastService } from '../../shared/services/toast.service'
import { QuizCard } from '../../shared/components/quiz-card/quiz-card'
import { CATEGORIES } from '../../shared/models/categories'
import { QuizSummary } from '../../shared/models/quiz.model'
import { GoogleButton } from '../../shared/components/google-button/google-button'

@Component({
  imports: [ReactiveFormsModule, RouterLink, QuizCard, GoogleButton],
  selector: 'app-landing',
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {
  protected readonly auth = inject(AuthService)
  private readonly quizService = inject(QuizService)
  private readonly matchService = inject(MatchService)
  private readonly toast = inject(ToastService)
  private readonly router = inject(Router)
  private readonly fb = inject(FormBuilder)

  protected readonly categories = CATEGORIES

  protected readonly popular = toSignal(
    this.quizService
      .getPublic({ limit: 20 })
      .pipe(map(page => [...page.data].sort((a, b) => b.timesPlayed - a.timesPlayed).slice(0, 3)))
  )

  protected readonly steps = [
    {
      title: 'Elige o crea un quiz',
      text: 'Escoge uno de la comunidad o genera uno nuevo con IA a partir de cualquier tema.'
    },
    {
      title: 'Comparte el código',
      text: 'Tus amigos entran desde su celular con el código de 4 letras, sin crear cuenta.'
    },
    {
      title: 'Responde y gana',
      text: 'Entre más rápido aciertes, más puntos. El ranking se actualiza en cada pregunta.'
    }
  ]

  protected readonly joining = signal(false)
  protected readonly joinError = signal<string | null>(null)

  protected readonly joinForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[a-zA-Z]{4}$/)]]
  })

  protected join (): void {
    if (this.joinForm.invalid) {
      this.joinForm.markAllAsTouched()
      return
    }

    const code = this.joinForm.controls.code.value.toUpperCase()
    this.joining.set(true)
    this.joinError.set(null)

    this.matchService.roomExists(code).subscribe({
      next: exists => {
        this.joining.set(false)
        if (!exists) {
          this.joinError.set(`No encontramos una sala activa con el código ${code}.`)
          return
        }
        this.router.navigate(['/play', code])
      },
      error: () => this.joining.set(false)
    })
  }

  protected playQuiz (quiz: QuizSummary): void {
    this.router.navigate(['/room/new'], { queryParams: { quiz: quiz._id } })
  }

  protected loginWithGoogle (credential: string): void {
    this.auth.loginWithGoogle(credential).subscribe({
      next: user => {
        this.toast.success(`¡Hola, ${user.displayName}!`)
        this.router.navigateByUrl('/dashboard')
      },
      // la petición es silenciosa para el interceptor; aquí no hay formulario, así que va en toast
      error: (err: Error) => this.toast.error(err.message)
    })
  }
}

import { Component, OnInit, computed, inject, input, signal } from '@angular/core'
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { QuizService } from '../../shared/services/quiz.service'
import { ToastService } from '../../shared/services/toast.service'
import { ConfirmService } from '../../shared/services/confirm.service'
import { AuthService } from '../../shared/services/auth.service'
import { TopicPicker } from '../../shared/components/topic-picker/topic-picker'
import { HasUnsavedChanges } from '../../shared/guards/unsaved-changes.guard'
import { Quiz, QuizDraft } from '../../shared/models/quiz.model'
import {
  QuestionEditor,
  QuestionForm,
  QuestionValue,
  createQuestionForm
} from './components/question-editor/question-editor'

type Mode = 'manual' | 'ai'

@Component({
  imports: [ReactiveFormsModule, RouterLink, TopicPicker, QuestionEditor],
  selector: 'app-quiz-form',
  templateUrl: './quiz-form.html',
  styleUrl: './quiz-form.scss',
  host: { '(window:beforeunload)': 'onBeforeUnload($event)' }
})
export class QuizForm implements OnInit, HasUnsavedChanges {
  private readonly fb = inject(FormBuilder)
  private readonly quizService = inject(QuizService)
  private readonly toast = inject(ToastService)
  private readonly confirm = inject(ConfirmService)
  private readonly router = inject(Router)
  private readonly auth = inject(AuthService)

  /** :id de la ruta; si existe, modo edición */
  readonly id = input<string>()
  protected readonly isEdit = computed(() => !!this.id())

  protected readonly loading = signal(false)
  protected readonly saving = signal(false)
  protected readonly generating = signal(false)
  protected readonly mode = signal<Mode>('manual')
  protected readonly coverPreview = signal<string | null>(null)
  private saved = false

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    description: ['', Validators.maxLength(500)],
    topic: ['', Validators.required],
    isPublic: [true],
    tags: this.fb.nonNullable.control<string[]>([]),
    questions: new FormArray<QuestionForm>([createQuestionForm()], {
      validators: Validators.minLength(1)
    })
  })

  protected readonly numQuestions = this.fb.nonNullable.control(5, [
    Validators.min(3),
    Validators.max(20)
  ])

  protected get c () {
    return this.form.controls
  }
  protected get questions () {
    return this.form.controls.questions
  }

  ngOnInit (): void {
    const id = this.id()
    if (!id) return

    this.loading.set(true)
    this.quizService.getById(id).subscribe({
      next: quiz => {
        this.loading.set(false)
        this.fill(quiz)
      },
      // 404 (no existe o es privado de otro usuario): el interceptor ya mostró el toast
      error: () => {
        this.loading.set(false)
        this.router.navigate(['/quizzes/mine'])
      }
    })
  }

  // ---------- Carga ----------
  private fill (quiz: Quiz): void {
    // Un quiz público de otro usuario se puede ver, pero no editar (la API respondería 403 al guardar)
    if (quiz.owner._id !== this.auth.user()?._id) {
      this.toast.warning('Solo puedes editar tus propios quizzes.')
      this.router.navigate(['/quizzes/mine'])
      return
    }

    this.form.patchValue({
      title: quiz.title,
      description: quiz.description ?? '',
      topic: quiz.topic ?? '',
      isPublic: quiz.isPublic,
      tags: [...quiz.tags]
    })
    this.setQuestions(quiz.questions)
    this.coverPreview.set(quiz.coverImageUrl ?? null)
    this.form.markAsPristine()
  }

  private setQuestions (list: Partial<QuestionValue>[]): void {
    this.questions.clear()
    list.forEach(q => this.questions.push(createQuestionForm(q)))
  }

  // ---------- Preguntas ----------
  protected addQuestion (): void {
    this.questions.push(createQuestionForm())
    this.questions.markAsDirty()
  }

  protected removeQuestion (i: number): void {
    if (this.questions.length === 1) {
      this.toast.warning('El quiz necesita al menos una pregunta.')
      return
    }
    this.questions.removeAt(i)
    this.questions.markAsDirty()
  }

  protected duplicateQuestion (i: number): void {
    this.questions.insert(i + 1, createQuestionForm(this.questions.at(i).getRawValue()))
    this.questions.markAsDirty()
  }

  protected moveQuestion (i: number, dir: -1 | 1): void {
    const j = i + dir
    if (j < 0 || j >= this.questions.length) return
    const question = this.questions.at(i)
    this.questions.removeAt(i)
    this.questions.insert(j, question)
    this.questions.markAsDirty()
  }

  // ---------- Etiquetas ----------
  protected addTag (input: HTMLInputElement): void {
    const tag = input.value.trim().toLowerCase()
    const tags = this.c.tags.value
    if (tag && !tags.includes(tag) && tags.length < 8) {
      this.c.tags.setValue([...tags, tag])
      this.c.tags.markAsDirty()
    }
    input.value = ''
  }

  protected removeTag (tag: string): void {
    this.c.tags.setValue(this.c.tags.value.filter(t => t !== tag))
    this.c.tags.markAsDirty()
  }


  // ---------- IA ----------
  protected generate (): void {
    const topic = this.c.topic
    if (topic.invalid || this.numQuestions.invalid) {
      topic.markAsTouched()
      return
    }

    const run = () => {
      this.generating.set(true)
      this.quizService.generateQuestions(topic.value.trim(), this.numQuestions.value).subscribe({
        next: list => {
          this.generating.set(false)
          this.setQuestions(list)
          if (!this.c.title.value) this.c.title.setValue(`Quiz de ${topic.value.trim()}`)
          this.form.markAsDirty()
          this.mode.set('manual')
          this.toast.success(`Se generaron ${list.length} preguntas. Revísalas antes de guardar.`)
        },
        error: () => this.generating.set(false)
      })
    }

    const hasContent = this.questions.controls.some(q => q.controls.question.value.trim())
    if (!hasContent) return run()

    this.confirm
      .confirm({
        title: '¿Reemplazar las preguntas?',
        message: 'Las preguntas que ya escribiste se reemplazarán por las generadas con IA.',
        confirmText: 'Reemplazar',
        variant: 'danger'
      })
      .subscribe(ok => ok && run())
  }

  // ---------- Guardar / salir ----------
  protected save (): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      this.mode.set('manual')
      this.toast.error('Revisa los campos marcados en rojo.')
      return
    }

    this.saving.set(true)
    this.quizService.save(this.toDraft(), this.id()).subscribe({
      next: () => {
        this.saving.set(false)
        this.saved = true
        this.toast.success(
          this.isEdit() ? 'Los cambios se guardaron correctamente.' : 'El quiz se creó correctamente.'
        )
        this.router.navigate(['/quizzes/mine'])
      },
      error: () => this.saving.set(false) // el botón se vuelve a habilitar; el mensaje lo pone #33
    })
  }

  protected cancel (): void {
    this.router.navigate(['/quizzes/mine']) // el guard pide confirmación si hay cambios
  }

  hasUnsavedChanges (): boolean {
    return this.form.dirty && !this.saved
  }

  protected onBeforeUnload (event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault() // aviso nativo al cerrar o recargar la pestaña
  }

  private toDraft (): QuizDraft {
    const raw = this.form.getRawValue()
    return {
      ...raw,
      topic: raw.topic.trim(),
      questions: raw.questions.map(q => ({
        ...q,
        correctIndex: q.correctIndex ?? 0,
        // Nunca mandar un blob: a la API (solo existe en este navegador)
        imageUrl: q.imageUrl && !q.imageUrl.startsWith('blob:') ? q.imageUrl : undefined
      }))
    }
  }
}

import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core'
import { Observable, Subscription, concat, defer, tap } from 'rxjs'
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Router, RouterLink } from '@angular/router'
import { QuizService } from '../../shared/services/quiz.service'
import { ToastService } from '../../shared/services/toast.service'
import { ConfirmService } from '../../shared/services/confirm.service'
import { TopicPicker } from '../../shared/components/topic-picker/topic-picker'
import { FileUploader } from '../../shared/components/file-uploader/file-uploader'
import { HasUnsavedChanges } from '../../shared/guards/unsaved-changes.guard'
import {
  DEFAULT_AI_QUESTION_COUNT,
  MAX_AI_QUESTIONS,
  MIN_AI_QUESTIONS,
  Quiz,
  QuizDraft
} from '../../shared/models/quiz.model'
import { UploadEvent } from '../../shared/models/upload.model'
import {
  QuestionEditor,
  QuestionForm,
  QuestionValue,
  createQuestionForm
} from './components/question-editor/question-editor'

type Mode = 'manual' | 'ai'

/** Imagen elegida que todavía no se sube: se sube al guardar, cuando el quiz ya tiene id */
interface PendingImage {
  file: File
  previewUrl: string
}

interface UploadJob {
  label: string
  run: () => Observable<UploadEvent>
}

interface UploadProgress {
  label: string
  current: number
  total: number
  progress: number
}

@Component({
  imports: [ReactiveFormsModule, RouterLink, TopicPicker, QuestionEditor, FileUploader],
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

  readonly id = input<string>()
  protected readonly isEdit = computed(() => !!this.id())

  protected readonly loading = signal(false)
  protected readonly saving = signal(false)
  protected readonly generating = signal(false)
  protected readonly mode = signal<Mode>('manual')
  protected readonly coverPreview = signal<string | null>(null)
  private saved = false

  // Imágenes elegidas con <app-file-uploader mode="pick">: se suben justo después de guardar.
  // Así el quiz ya existe y el índice de cada pregunta es el mismo que guardó la API.
  private readonly pendingImages = new Map<QuestionForm, PendingImage>()
  protected readonly pendingCover = signal<PendingImage | null>(null)
  protected readonly uploading = signal<UploadProgress | null>(null)
  private uploadSub?: Subscription

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

  // Mismo rango que el slider de IA en Nueva partida y el lobby (constantes compartidas)
  protected readonly minQuestions = MIN_AI_QUESTIONS
  protected readonly maxQuestions = MAX_AI_QUESTIONS
  protected readonly numQuestions = this.fb.nonNullable.control(DEFAULT_AI_QUESTION_COUNT, [
    Validators.min(MIN_AI_QUESTIONS),
    Validators.max(MAX_AI_QUESTIONS)
  ])

  protected get c () {
    return this.form.controls
  }
  protected get questions () {
    return this.form.controls.questions
  }

  constructor () {
    inject(DestroyRef).onDestroy(() => {
      this.uploadSub?.unsubscribe()
      this.pendingImages.forEach(p => URL.revokeObjectURL(p.previewUrl))
      const cover = this.pendingCover()
      if (cover) URL.revokeObjectURL(cover.previewUrl)
    })
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
      error: () => {
        this.loading.set(false)
        this.router.navigate(['/quizzes/mine'])
      }
    })
  }

  private fill (quiz: Quiz): void {
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

  protected readonly uploadCover = (file: File) => this.quizService.uploadCover(this.id()!, file)

  protected onCoverUploaded (url: string): void {
    this.coverPreview.set(url)
    this.toast.success('La portada se subió correctamente.')
  }

  /** Portada al crear: se guarda aquí y se sube en cuanto el quiz exista */
  protected onCoverPicked (file: File): void {
    this.removePendingCover()
    this.pendingCover.set({ file, previewUrl: URL.createObjectURL(file) })
    this.form.markAsDirty()
  }

  protected removePendingCover (): void {
    const cover = this.pendingCover()
    if (cover) URL.revokeObjectURL(cover.previewUrl)
    this.pendingCover.set(null)
  }

  /** Imagen de una pregunta: vista previa local (blob:) y el archivo queda pendiente hasta guardar */
  protected onQuestionImage (q: QuestionForm, file: File): void {
    const previous = this.pendingImages.get(q)
    if (previous) URL.revokeObjectURL(previous.previewUrl)
    const previewUrl = URL.createObjectURL(file)
    this.pendingImages.set(q, { file, previewUrl })
    q.controls.imageUrl.setValue(previewUrl)
    q.controls.imageUrl.markAsDirty()
  }

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
    const original = this.questions.at(i)
    const copy = createQuestionForm(original.getRawValue())
    this.questions.insert(i + 1, copy)
    // Si la original tiene una imagen pendiente, la copia también (con su propia vista previa)
    const pending = this.pendingImages.get(original)
    if (pending && original.controls.imageUrl.value === pending.previewUrl) this.onQuestionImage(copy, pending.file)
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

  protected save (): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      this.mode.set('manual')
      this.toast.error('Revisa los campos marcados en rojo.')
      return
    }

    this.saving.set(true)
    this.quizService.save(this.toDraft(), this.id()).subscribe({
      next: quiz => {
        this.saved = true
        this.uploadPendingImages(quiz)
      },
      error: () => this.saving.set(false) 
    })
  }

  protected cancel (): void {
    this.router.navigate(['/quizzes/mine']) 
  }

  /** Sube, una por una, la portada pendiente y las imágenes nuevas de las preguntas */
  private uploadPendingImages (quiz: Quiz): void {
    const jobs: UploadJob[] = []
    const cover = this.pendingCover()
    if (cover) jobs.push({ label: 'la portada', run: () => this.quizService.uploadCover(quiz._id, cover.file) })

    this.questions.controls.forEach((q, i) => {
      const pending = this.pendingImages.get(q)
      // Solo si sigue siendo la imagen de la pregunta (no la quitaron ni la cambiaron)
      if (pending && q.controls.imageUrl.value === pending.previewUrl) {
        jobs.push({
          label: `la imagen de la pregunta ${i + 1}`,
          run: () => this.quizService.uploadQuestionImage(quiz._id, i, pending.file)
        })
      }
    })

    if (!jobs.length) return this.finishSave()

    let current = jobs[0]
    this.uploadSub = concat(
      ...jobs.map((job, k) =>
        defer(() => {
          current = job
          this.uploading.set({ label: job.label, current: k + 1, total: jobs.length, progress: 0 })
          return job.run()
        }).pipe(tap(e => this.uploading.update(u => (u ? { ...u, progress: e.progress } : u))))
      )
    ).subscribe({
      complete: () => {
        this.uploading.set(null)
        this.finishSave()
      },
      error: (err: Error) => {
        this.uploading.set(null)
        this.finishWithMissingImages(`no se pudo subir ${current.label} (${err.message})`)
      }
    })
  }

  protected cancelUploads (): void {
    this.uploadSub?.unsubscribe()
    this.uploading.set(null)
    this.finishWithMissingImages('cancelaste la subida de las imágenes que faltaban')
  }

  private finishSave (): void {
    this.saving.set(false)
    this.toast.success(this.isEdit() ? 'Los cambios se guardaron correctamente.' : 'El quiz se creó correctamente.')
    this.router.navigate(['/quizzes/mine'])
  }

  /** El quiz ya quedó guardado; solo faltan imágenes, que se pueden volver a subir desde Editar */
  private finishWithMissingImages (reason: string): void {
    this.saving.set(false)
    this.toast.warning(`El quiz se guardó, pero ${reason}. Puedes agregarlas desde Editar.`)
    this.router.navigate(['/quizzes/mine'])
  }

  hasUnsavedChanges (): boolean {
    return this.form.dirty && !this.saved
  }

  protected onBeforeUnload (event: BeforeUnloadEvent): void {
    if (this.hasUnsavedChanges()) event.preventDefault() 
  }

  private toDraft (): QuizDraft {
    const raw = this.form.getRawValue()
    return {
      ...raw,
      topic: raw.topic.trim(),
      questions: raw.questions.map(q => ({
        ...q,
        correctIndex: q.correctIndex ?? 0,
        imageUrl: q.imageUrl && !q.imageUrl.startsWith('blob:') ? q.imageUrl : undefined
      }))
    }
  }
}
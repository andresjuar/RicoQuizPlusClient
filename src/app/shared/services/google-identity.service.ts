import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/** Lo mínimo que usamos de Google Identity Services (window.google.accounts.id) */
interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: 'popup' | 'redirect';
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }): void;
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

export type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with';

const SCRIPT_URL = 'https://accounts.google.com/gsi/client';

/**
 * Carga el script de Google una sola vez y dibuja su botón oficial.
 * El botón entrega un `credential` (ID token JWT) que se manda a POST /auth/google;
 * la API lo verifica con google-auth-library, así que aquí no se valida nada.
 */
@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private scriptLoad?: Promise<void>;
  private initialized = false;
  /** Quién recibe el credential: el botón que se dibujó al último (login o registro) */
  private onCredential?: (credential: string) => void;

  readonly enabled = !!environment.googleClientId;

  async renderButton(
    parent: HTMLElement,
    text: GoogleButtonText,
    onCredential: (credential: string) => void,
  ): Promise<void> {
    await this.loadScript();
    const id = window.google!.accounts.id;

    this.onCredential = onCredential;
    if (!this.initialized) {
      // initialize se llama una vez por página; el callback reenvía al botón actual
      id.initialize({
        client_id: environment.googleClientId,
        callback: ({ credential }) => this.onCredential?.(credential),
        ux_mode: 'popup',
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      this.initialized = true;
    }

    id.renderButton(parent, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      shape: 'pill',
      text,
      locale: 'es',
      width: Math.min(parent.clientWidth || 320, 400), // Google acepta máximo 400 px
    });
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) return Promise.resolve();

    this.scriptLoad ??= new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        this.scriptLoad = undefined; // permite reintentar al volver a la página
        reject(new Error('No se pudo cargar Google'));
      };
      document.head.appendChild(script);
    });
    return this.scriptLoad;
  }
}

import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  template: `
    <span class="avatar"
      [style.width.px]="size()" [style.height.px]="size()"
      [style.font-size.px]="size() * 0.38"
      [style.background]="color()">{{ initials() }}</span>
  `,
  styles: `
    .avatar {
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 50%; font-weight: 700; color: #fff;
      text-transform: uppercase; flex-shrink: 0;
    }
  `,
})
export class Avatar {
  readonly name = input.required<string>();
  readonly size = input(36);

  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/);
    return words.length > 1 ? words[0][0] + words[1][0] : words[0].slice(0, 2);
  });

  // El mismo nombre siempre produce el mismo color
  protected readonly color = computed(() => {
    let hue = 0;
    for (const c of this.name()) hue = (hue * 31 + c.charCodeAt(0)) % 360;
    return `hsl(${hue} 60% 52%)`;
  });
}
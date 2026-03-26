import { CommonModule } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import DOMPurify from 'dompurify';
import { marked } from 'marked';

@Component({
  selector: 'app-markdown-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="markdown-viewer" [innerHTML]="rendered()"></div>`,
  styles: [
    `
      .markdown-viewer {
        color: var(--text-secondary);
        line-height: 1.7;
      }
      .markdown-viewer :is(h1, h2, h3, h4) {
        color: var(--text-primary);
        margin: 0 0 0.65rem;
      }
      .markdown-viewer p { margin: 0 0 0.75rem; }
      .markdown-viewer ul, .markdown-viewer ol { padding-left: 1.2rem; margin: 0 0 0.75rem; }
      .markdown-viewer code {
        font-family: var(--font-mono);
        padding: 0.1rem 0.35rem;
        border-radius: 0.35rem;
        background: rgba(255, 255, 255, 0.08);
      }
      .markdown-viewer pre {
        overflow: auto;
        padding: 0.9rem;
        border-radius: 0.9rem;
        background: rgba(0, 0, 0, 0.28);
      }
      .markdown-viewer table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 0.75rem;
      }
      .markdown-viewer th, .markdown-viewer td {
        padding: 0.5rem;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        text-align: left;
      }
      .markdown-viewer a { color: var(--color-primary-light); }
    `,
  ],
})
export class MarkdownViewerComponent {
  readonly content = input<string>('');

  readonly rendered = computed(() => {
    const html = marked.parse(this.content() || '', { async: false }) as string;
    return DOMPurify.sanitize(html);
  });
}

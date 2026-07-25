import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Autorise une URL d'intégration vidéo (YouTube) à être utilisée dans un [src] d'iframe. */
@Pipe({ name: 'safeEmbed', standalone: true })
export class SafeEmbedPipe implements PipeTransform {
  constructor(private sanitizer: DomSanitizer) {}

  transform(url: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }
}

import { Directive, ElementRef, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
  selector: '[appClickOutside]',
})
export class ClickOutside {
  @Output() appClickOutside = new EventEmitter<MouseEvent>();

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as Node;
    const clickedInside = this.elementRef.nativeElement.contains(target);

    if (!clickedInside) {
      this.appClickOutside.emit(event);
    }
  }
}

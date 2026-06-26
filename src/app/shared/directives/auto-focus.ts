import { Directive, ElementRef, AfterViewInit, Input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
})
export class AutoFocus implements AfterViewInit {
  @Input() appAutoFocus: boolean | '' = true;

  constructor(private elementRef: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    if (this.appAutoFocus === false) {
      return;
    }

    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    });
  }
}

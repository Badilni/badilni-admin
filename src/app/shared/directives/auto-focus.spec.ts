import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';

import { AutoFocus } from './auto-focus';

@Component({
  standalone: true,
  imports: [AutoFocus],
  template: `<input appAutoFocus />`,
})
class TestHostComponent {}

@Component({
  standalone: true,
  imports: [AutoFocus],
  template: `<input [appAutoFocus]="false" />`,
})
class TestHostDisabledComponent {}

describe('AutoFocus', () => {
  it('should create an instance', () => {
    const directive = new AutoFocus({ nativeElement: document.createElement('input') } as any);
    expect(directive).toBeTruthy();
  });

  it('should focus the host element after view init', fakeAsync(() => {
    const fixture: ComponentFixture<TestHostComponent> = TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).createComponent(TestHostComponent);

    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    tick();

    const input = fixture.nativeElement.querySelector('input');
    expect(document.activeElement).toBe(input);

    fixture.nativeElement.remove();
  }));

  it('should NOT focus the host element when appAutoFocus is false', fakeAsync(() => {
    const fixture: ComponentFixture<TestHostDisabledComponent> = TestBed.configureTestingModule({
      imports: [TestHostDisabledComponent],
    }).createComponent(TestHostDisabledComponent);

    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    tick();

    const input = fixture.nativeElement.querySelector('input');
    expect(document.activeElement).not.toBe(input);

    fixture.nativeElement.remove();
  }));
});

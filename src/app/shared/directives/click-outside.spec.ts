import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClickOutside } from './click-outside';

@Component({
  standalone: true,
  imports: [ClickOutside],
  template: `
    <div id="inside" (appClickOutside)="onOutsideClick()"></div>
    <div id="outside"></div>
  `,
})
class TestHostComponent {
  outsideClickCount = 0;

  onOutsideClick(): void {
    this.outsideClickCount++;
  }
}

describe('ClickOutside', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let component: TestHostComponent;

  beforeEach(() => {
    fixture = TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).createComponent(TestHostComponent);

    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    component = fixture.componentInstance;
  });

  afterEach(() => {
    fixture.nativeElement.remove();
  });

  it('should create an instance', () => {
    const directive = new ClickOutside({ nativeElement: document.createElement('div') } as any);
    expect(directive).toBeTruthy();
  });

  it('should emit appClickOutside when clicking outside the host element', () => {
    const outsideEl = fixture.nativeElement.querySelector('#outside');
    outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(component.outsideClickCount).toBe(1);
  });

  it('should NOT emit appClickOutside when clicking inside the host element', () => {
    const insideEl = fixture.nativeElement.querySelector('#inside');
    insideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(component.outsideClickCount).toBe(0);
  });

  it('should emit multiple times for multiple outside clicks', () => {
    const outsideEl = fixture.nativeElement.querySelector('#outside');
    outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    outsideEl.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(component.outsideClickCount).toBe(2);
  });
});

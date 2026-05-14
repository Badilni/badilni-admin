import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Disputes } from './disputes';

describe('Disputes', () => {
  let component: Disputes;
  let fixture: ComponentFixture<Disputes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Disputes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Disputes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

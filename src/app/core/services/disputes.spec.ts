import { TestBed } from '@angular/core/testing';

import { Disputes } from './disputes';

describe('Disputes', () => {
  let service: Disputes;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Disputes);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

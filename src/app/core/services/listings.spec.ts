import { TestBed } from '@angular/core/testing';

import { Listings } from './listings';

describe('Listings', () => {
  let service: Listings;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Listings);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { Listings } from './listings';

describe('Listings', () => {
  let service: Listings;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Listings],
    });
    service = TestBed.inject(Listings);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

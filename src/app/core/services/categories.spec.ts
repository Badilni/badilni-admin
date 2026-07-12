import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { Categories } from './categories';

describe('Categories', () => {
  let service: Categories;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Categories],
    });
    service = TestBed.inject(Categories);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

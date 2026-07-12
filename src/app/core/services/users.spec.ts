import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { Users } from './users';

describe('Users', () => {
  let service: Users;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Users],
    });
    service = TestBed.inject(Users);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

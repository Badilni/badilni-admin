import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Listings } from './listings';
import { Listings as ListingsService } from '../../core/services/listings';

const mockListingsResponse = {
  status: 'success',
  data: {
    listings: [
      { _id: 'LST-001', title: 'Graphic Design Basics', provider: 'PRV-1045', price: 200, tags: ['Design'], status: 'active' },
      { _id: 'LST-002', title: 'Web Development', provider: 'PRV-987', price: 500, tags: ['Programming'], status: 'active' },
    ],
  },
  pagination: { page: 1, limit: 10, totalCount: 2, totalPages: 1 },
};

describe('Listings Component', () => {
  let component: Listings;
  let fixture: ComponentFixture<Listings>;
  let listingsServiceSpy: jasmine.SpyObj<ListingsService>;

  beforeEach(async () => {
    listingsServiceSpy = jasmine.createSpyObj('ListingsService', ['getAll', 'update', 'delete']);
    listingsServiceSpy.getAll.and.returnValue(of(mockListingsResponse));
    listingsServiceSpy.update.and.returnValue(of(mockListingsResponse.data.listings[0] as any));
    listingsServiceSpy.delete.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [Listings],
      providers: [{ provide: ListingsService, useValue: listingsServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Listings);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load listings on init', fakeAsync(() => {
    tick();
    expect(component.listings().length).toBe(2);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should fall back to mock data on API error', fakeAsync(() => {
    listingsServiceSpy.getAll.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    tick();
    expect(component.listings().length).toBeGreaterThan(0);
  }));

  it('should reset to page 1 on search', () => {
    component.currentPage.set(3);
    component.onSearch('design');
    expect(component.currentPage()).toBe(1);
    expect(component.searchKeyword()).toBe('design');
  });

  it('should reset to page 1 on status change', () => {
    component.currentPage.set(2);
    component.onStatusChange('inactive');
    expect(component.currentPage()).toBe(1);
  });

  it('should not navigate below page 1', () => {
    component.currentPage.set(1);
    component.onPageChange(0);
    expect(component.currentPage()).toBe(1);
  });

  it('should return correct status badge classes', () => {
    expect(component.getStatusClass('active')).toContain('badge--active');
    expect(component.getStatusClass('inactive')).toContain('badge--inactive');
    expect(component.getStatusClass('pending')).toContain('badge--pending');
    expect(component.getStatusClass('suspended')).toContain('badge--suspended');
  });

  it('should call update when toggling status', fakeAsync(() => {
    const listing = { _id: 'LST-001', title: 'Test', provider: 'PRV-001', price: 100, tags: [], status: 'active' as const };
    component.onToggleStatus(listing);
    tick();
    expect(listingsServiceSpy.update).toHaveBeenCalledWith('LST-001', { status: 'inactive' });
  }));

  it('should call delete and reload', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.onDelete('LST-001');
    tick();
    expect(listingsServiceSpy.delete).toHaveBeenCalledWith('LST-001');
  }));

  it('should generate correct page array', () => {
    component.totalPages.set(4);
    expect(component.getPages()).toEqual([1, 2, 3, 4]);
  });
});

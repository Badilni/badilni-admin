import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Categories } from './categories';
import { Categories as CategoriesService } from '../../core/services/categories';
import { Category } from '../../core/models/category';

const mockCategory: Category = {
  _id: 'CAT-001', name: 'Design', slug: 'design',
  icon: '🎨', order: 1, active: true,
};

const mockResponse = {
  status: 'success',
  data: { categories: [mockCategory] },
  pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 },
};

describe('Categories Component', () => {
  let component: Categories;
  let fixture: ComponentFixture<Categories>;
  let serviceSpy: jasmine.SpyObj<CategoriesService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('CategoriesService', [
      'getAll', 'create', 'update', 'delete',
    ]);
    serviceSpy.getAll.and.returnValue(of(mockResponse));
    serviceSpy.create.and.returnValue(of(mockCategory));
    serviceSpy.update.and.returnValue(of(mockCategory));
    serviceSpy.delete.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [Categories],
      providers: [{ provide: CategoriesService, useValue: serviceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Categories);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load categories on init', fakeAsync(() => {
    tick();
    expect(component.categories().length).toBe(1);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should fall back to mock data on API error', fakeAsync(() => {
    serviceSpy.getAll.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    tick();
    expect(component.categories().length).toBeGreaterThan(0);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should open create modal with empty form', () => {
    component.openCreateModal();
    expect(component.showModal()).toBeTrue();
    expect(component.isEditMode()).toBeFalse();
    expect(component.formData().name).toBe('');
  });

  it('should open edit modal with category data', () => {
    component.openEditModal(mockCategory);
    expect(component.showModal()).toBeTrue();
    expect(component.isEditMode()).toBeTrue();
    expect(component.formData().name).toBe('Design');
  });

  it('should close modal on closeModal()', () => {
    component.showModal.set(true);
    component.closeModal();
    expect(component.showModal()).toBeFalse();
  });

  it('should call create service when saving new category', fakeAsync(() => {
    component.openCreateModal();
    component.onSave();
    tick();
    expect(serviceSpy.create).toHaveBeenCalled();
  }));

  it('should call update service in edit mode', fakeAsync(() => {
    component.openEditModal(mockCategory);
    component.onSave();
    tick();
    expect(serviceSpy.update).toHaveBeenCalledWith('CAT-001', jasmine.any(Object));
  }));

  it('should call delete service and reload', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.onDelete('CAT-001');
    tick();
    expect(serviceSpy.delete).toHaveBeenCalledWith('CAT-001');
  }));

  it('should not delete when confirm is cancelled', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(false);
    component.onDelete('CAT-001');
    tick();
    expect(serviceSpy.delete).not.toHaveBeenCalled();
  }));

  it('should return correct status classes', () => {
    expect(component.getStatusClass(true)).toContain('badge--active');
    expect(component.getStatusClass(false)).toContain('badge--inactive');
  });

  it('should return correct status labels', () => {
    expect(component.getStatusLabel(true)).toBe('Active');
    expect(component.getStatusLabel(false)).toBe('Inactive');
  });

  it('should update form field correctly', () => {
    component.updateForm('name', 'NewName');
    expect(component.formData().name).toBe('NewName');
  });

  it('should generate correct page array', () => {
    component.totalPages.set(3);
    expect(component.getPages()).toEqual([1, 2, 3]);
  });

  it('should not navigate below page 1', () => {
    component.currentPage.set(1);
    component.onPageChange(0);
    expect(component.currentPage()).toBe(1);
  });
});

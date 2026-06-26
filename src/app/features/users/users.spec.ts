import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Users } from './users';
import { Users as UsersService } from '../../core/services/users';

const mockUsersResponse = {
  status: 'success',
  data: {
    users: [
      { _id: 'USR-001', name: 'Ahmed Samir', email: 'ahmed@example.com', role: 'user', walletBalance: 1250, totalSessionsCompleted: 24, status: 'active', isVerified: true },
      { _id: 'USR-002', name: 'Sara Ali', email: 'sara@example.com', role: 'user', walletBalance: 3210, totalSessionsCompleted: 56, status: 'active', isVerified: true },
    ],
  },
  pagination: { page: 1, limit: 10, totalCount: 2, totalPages: 1 },
};

describe('Users Component', () => {
  let component: Users;
  let fixture: ComponentFixture<Users>;
  let usersServiceSpy: jasmine.SpyObj<UsersService>;

  beforeEach(async () => {
    usersServiceSpy = jasmine.createSpyObj('UsersService', ['getAll', 'delete']);
    usersServiceSpy.getAll.and.returnValue(of(mockUsersResponse));
    usersServiceSpy.delete.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [Users],
      providers: [{ provide: UsersService, useValue: usersServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Users);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', fakeAsync(() => {
    tick();
    expect(component.users().length).toBe(2);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should use mock data when API fails', fakeAsync(() => {
    usersServiceSpy.getAll.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    tick();
    expect(component.users().length).toBeGreaterThan(0);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should reset page to 1 on search', () => {
    component.currentPage.set(3);
    component.onSearch('ahmed');
    expect(component.currentPage()).toBe(1);
    expect(component.searchKeyword()).toBe('ahmed');
  });

  it('should reset page to 1 on role change', () => {
    component.currentPage.set(2);
    component.onRoleChange('admin');
    expect(component.currentPage()).toBe(1);
    expect(component.selectedRole()).toBe('admin');
  });

  it('should not change page below 1', () => {
    component.currentPage.set(1);
    component.onPageChange(0);
    expect(component.currentPage()).toBe(1);
  });

  it('should not change page above totalPages', fakeAsync(() => {
    tick();
    component.totalPages.set(3);
    component.currentPage.set(3);
    component.onPageChange(4);
    expect(component.currentPage()).toBe(3);
  }));

  it('should return correct status classes', () => {
    expect(component.getStatusClass('active')).toContain('badge--active');
    expect(component.getStatusClass('suspended')).toContain('badge--suspended');
    expect(component.getStatusClass('inactive')).toContain('badge--inactive');
  });

  it('should return inactive badge class when status is undefined', () => {
    expect(component.getStatusClass(undefined)).toContain('badge--inactive');
  });

  it('should return correct role labels', () => {
    expect(component.getRoleLabel('user')).toBe('User');
    expect(component.getRoleLabel('admin')).toBe('Admin');
  });

  it('should generate correct page numbers', fakeAsync(() => {
    tick();
    component.totalPages.set(3);
    expect(component.getPages()).toEqual([1, 2, 3]);
  }));

  it('should call delete service and reload on onDelete', fakeAsync(() => {
    spyOn(window, 'confirm').and.returnValue(true);
    component.onDelete('USR-001');
    tick();
    expect(usersServiceSpy.delete).toHaveBeenCalledWith('USR-001');
  }));
});

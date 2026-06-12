import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { Layout } from './layout';
import { Auth } from '../../../core/services/auth';

describe('Layout', () => {
  let component: Layout;
  let fixture: ComponentFixture<Layout>;
  let authServiceSpy: jasmine.SpyObj<Auth>;

  beforeEach(async () => {
    const mockUser = {
      _id: '1',
      name: 'Admin User',
      email: 'admin@badilni.com',
      role: 'admin' as const,
      isVerified: true,
    };

    authServiceSpy = jasmine.createSpyObj('Auth', ['logout'], {
      currentUser: signal(mockUser),
    });
    authServiceSpy.logout.and.returnValue(of({ status: 'success' }));

    await TestBed.configureTestingModule({
      imports: [Layout, RouterTestingModule, NoopAnimationsModule],
      providers: [{ provide: Auth, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Layout);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display current user name', () => {
    expect(component.currentUser()?.name).toBe('Admin User');
  });

  it('should call logout on onLogout()', () => {
    component.onLogout();
    expect(authServiceSpy.logout).toHaveBeenCalled();
  });
});

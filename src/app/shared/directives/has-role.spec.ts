import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HasRole } from './has-role';
import { Auth } from '../../core/services/auth';

@Component({
  standalone: true,
  imports: [HasRole],
  template: `
    <div *appHasRole="'admin'" id="admin-only">Admin Content</div>
    <div *appHasRole="['user', 'admin']" id="user-or-admin">Shared Content</div>
  `,
})
class TestHostComponent {}

describe('HasRole', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let authServiceSpy: jasmine.SpyObj<Auth>;

  function setup(role: 'user' | 'admin' | undefined) {
    authServiceSpy = jasmine.createSpyObj('Auth', [], {
      currentUser: signal(role ? { role, _id: '1', name: 'Test', email: 't@t.com', isVerified: true } : null),
    });

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [{ provide: Auth, useValue: authServiceSpy }],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  }

  it('should create an instance', () => {
    const mockAuth = { currentUser: () => null } as unknown as Auth;
    const directive = new HasRole(
      {} as any,
      {} as any,
      mockAuth,
    );
    expect(directive).toBeTruthy();
  });

  it('should render admin-only content when user role is admin', () => {
    setup('admin');
    const el = fixture.nativeElement.querySelector('#admin-only');
    expect(el).toBeTruthy();
  });

  it('should NOT render admin-only content when user role is user', () => {
    setup('user');
    const el = fixture.nativeElement.querySelector('#admin-only');
    expect(el).toBeFalsy();
  });

  it('should render shared content for both user and admin roles', () => {
    setup('user');
    const el = fixture.nativeElement.querySelector('#user-or-admin');
    expect(el).toBeTruthy();
  });

  it('should NOT render any role-restricted content when there is no logged-in user', () => {
    setup(undefined);
    const adminEl = fixture.nativeElement.querySelector('#admin-only');
    const sharedEl = fixture.nativeElement.querySelector('#user-or-admin');
    expect(adminEl).toBeFalsy();
    expect(sharedEl).toBeFalsy();
  });
});

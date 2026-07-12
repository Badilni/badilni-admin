import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { signal } from '@angular/core';

import { Sidebar } from './sidebar';
import { Auth } from '../../../core/services/auth';

describe('Sidebar', () => {
  let component: Sidebar;
  let fixture: ComponentFixture<Sidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sidebar, RouterModule.forRoot([])],
      providers: [
        {
          provide: Auth,
          useValue: {
            currentUser: signal({ name: 'Admin', email: 'admin@test.com', role: 'admin' }),
            logout: jasmine.createSpy('logout').and.returnValue({ subscribe: () => {} }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Sidebar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 8 nav items', () => {
    expect(component.navItems.length).toBe(8);
  });

  it('should mark /dashboard as active when activeRoute is /dashboard', () => {
    component.activeRoute.set('/dashboard');
    expect(component.isActive('/dashboard')).toBeTrue();
  });

  it('should not mark /users as active when activeRoute is /dashboard', () => {
    component.activeRoute.set('/dashboard');
    expect(component.isActive('/users')).toBeFalse();
  });

  it('should contain Dashboard as first nav item', () => {
    expect(component.navItems[0].label).toBe('Dashboard');
    expect(component.navItems[0].route).toBe('/dashboard');
  });

  it('should contain Audit Log as last nav item', () => {
    const last = component.navItems[component.navItems.length - 1];
    expect(last.label).toBe('Audit Log');
    expect(last.route).toBe('/audit-log');
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AuditLog } from './audit-log';
import { AuditLog as AuditLogService } from '../../core/services/audit-log';
import { AdminAction } from '../../core/models/admin-action';

const mockLog: AdminAction = {
  _id: 'LOG-001',
  admin: 'ADM-001',
  targetId: 'USR-2311',
  action: 'suspend',
  details: { reason: 'Violation of terms' },
  createdAt: 'May 20, 2025 14:30',
};

const mockResponse = {
  status: 'success',
  data: { logs: [mockLog] },
  pagination: { page: 1, limit: 10, totalCount: 8542, totalPages: 3 },
};

describe('AuditLog Component', () => {
  let component: AuditLog;
  let fixture: ComponentFixture<AuditLog>;
  let serviceSpy: jasmine.SpyObj<AuditLogService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('AuditLogService', ['getAll']);
    serviceSpy.getAll.and.returnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [AuditLog],
      providers: [{ provide: AuditLogService, useValue: serviceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AuditLog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load logs on init', fakeAsync(() => {
    tick();
    expect(component.logs().length).toBe(1);
    expect(component.isLoading()).toBeFalse();
    expect(component.totalCount()).toBe(8542);
    expect(component.totalPages()).toBe(3);
  }));

  it('should fall back to mock data on API error', fakeAsync(() => {
    serviceSpy.getAll.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    tick();
    expect(component.logs().length).toBeGreaterThan(0);
    expect(component.isLoading()).toBeFalse();
    expect(component.totalCount()).toBe(7);
  }));

  it('should reset page and reload on action filter change', () => {
    component.currentPage.set(3);
    component.onActionChange('suspend');
    expect(component.currentPage()).toBe(1);
    expect(component.selectedAction()).toBe('suspend');
    expect(serviceSpy.getAll).toHaveBeenCalledTimes(2);
  });

  it('should pass action param when filter is not All Actions', fakeAsync(() => {
    component.onActionChange('delete');
    tick();
    const callArgs = serviceSpy.getAll.calls.mostRecent().args[0]!;
    expect(callArgs['action']).toBe('delete');
  }));

  it('should NOT pass action param when filter is All Actions', fakeAsync(() => {
    component.onActionChange('All Actions');
    tick();
    const callArgs = serviceSpy.getAll.calls.mostRecent().args[0]!;
    expect(callArgs['action']).toBeUndefined();
  }));

  it('should not navigate below page 1', () => {
    component.currentPage.set(1);
    component.onPageChange(0);
    expect(component.currentPage()).toBe(1);
    expect(serviceSpy.getAll).toHaveBeenCalledTimes(1);
  });

  it('should not navigate above totalPages', fakeAsync(() => {
    tick();
    component.totalPages.set(3);
    component.currentPage.set(3);
    component.onPageChange(4);
    expect(component.currentPage()).toBe(3);
  }));

  it('should navigate to correct page', fakeAsync(() => {
    tick();
    component.totalPages.set(3);
    component.onPageChange(2);
    expect(component.currentPage()).toBe(2);
    expect(serviceSpy.getAll).toHaveBeenCalledTimes(2);
  }));

  it('should generate correct page array', () => {
    component.totalPages.set(4);
    expect(component.getPages()).toEqual([1, 2, 3, 4]);
  });

  it('should return empty array when totalPages is 0', () => {
    component.totalPages.set(0);
    expect(component.getPages()).toEqual([]);
  });

  it('should return correct action badge class for suspend', () => {
    expect(component.getActionClass('suspend')).toBe('action-badge action-badge--red');
  });

  it('should return correct action badge class for unsuspend', () => {
    expect(component.getActionClass('unsuspend')).toBe('action-badge action-badge--green');
  });

  it('should return correct action badge class for delete', () => {
    expect(component.getActionClass('delete')).toBe('action-badge action-badge--darkred');
  });

  it('should return correct action badge class for credit_adjust', () => {
    expect(component.getActionClass('credit_adjust')).toBe('action-badge action-badge--blue');
  });

  it('should return correct action badge class for resolve_dispute', () => {
    expect(component.getActionClass('resolve_dispute')).toBe('action-badge action-badge--purple');
  });

  it('should return gray badge for unknown action', () => {
    expect(component.getActionClass('unknown_action')).toBe('action-badge action-badge--gray');
  });

  it('should format admin ID with # prefix', () => {
    expect(component.formatAdminId('ADM-001')).toBe('#ADM-001');
  });

  it('should format target user ID with # prefix', () => {
    expect(component.formatTargetId('USR-2311')).toBe('#USR-2311');
  });

  it('should return dash when targetId is undefined', () => {
    expect(component.formatTargetId(undefined)).toBe('—');
  });

  it('should use correct field name admin in mock log', () => {
    expect(mockLog.admin).toBe('ADM-001');
  });

  it('should use correct field name targetId in mock log', () => {
    expect(mockLog.targetId).toBe('USR-2311');
  });

  it('should extract reason from details object via formatDetails', () => {
    expect(component.formatDetails({ reason: 'Violation of terms' })).toBe('Violation of terms');
  });

  it('should return dash from formatDetails when details is undefined', () => {
    expect(component.formatDetails(undefined)).toBe('—');
  });

  it('should join values from formatDetails when no reason key exists', () => {
    expect(component.formatDetails({ note: 'Some note', amount: 50 })).toBe('Some note, 50');
  });

  it('should return dash from formatDetails when details is an empty object', () => {
    expect(component.formatDetails({})).toBe('—');
  });
});

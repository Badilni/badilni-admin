import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Transactions } from './transactions';
import { Transactions as TransactionsService } from '../../core/services/transactions';
import { Transaction } from '../../core/models/transaction';

const mockTx: Transaction = {
  _id: 'TXI-9F00TA',
  sender: 'USR-2311',
  receiver: 'PRV-1045',
  amount: 150,
  type: 'session_payment',
  status: 'completed',
  createdAt: '2025-05-20',
};

const mockResponse = {
  status: 'success',
  data: { transactions: [mockTx] },
  pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 2 },
};

describe('Transactions Component', () => {
  let component: Transactions;
  let fixture: ComponentFixture<Transactions>;
  let serviceSpy: jasmine.SpyObj<TransactionsService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('TransactionsService', ['getAll', 'adminAdjustment']);
    serviceSpy.getAll.and.returnValue(of(mockResponse));

    await TestBed.configureTestingModule({
      imports: [Transactions],
      providers: [{ provide: TransactionsService, useValue: serviceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Transactions);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load transactions on init', fakeAsync(() => {
    tick();
    expect(component.transactions().length).toBe(1);
    expect(component.isLoading()).toBeFalse();
    expect(component.totalPages()).toBe(2);
  }));

  it('should fall back to mock data on API error', fakeAsync(() => {
    serviceSpy.getAll.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    tick();
    expect(component.transactions().length).toBeGreaterThan(0);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should reset page on type change', () => {
    component.currentPage.set(3);
    component.onTypeChange('refund');
    expect(component.currentPage()).toBe(1);
    expect(component.selectedType()).toBe('refund');
  });

  it('should not navigate below page 1', () => {
    component.currentPage.set(1);
    component.onPageChange(0);
    expect(component.currentPage()).toBe(1);
  });

  it('should not navigate above totalPages', fakeAsync(() => {
    tick();
    component.totalPages.set(2);
    component.currentPage.set(2);
    component.onPageChange(3);
    expect(component.currentPage()).toBe(2);
  }));

  it('should return correct type badge classes', () => {
    expect(component.getTypeClass('session_payment')).toContain('type-badge--blue');
    expect(component.getTypeClass('escrow_lock')).toContain('type-badge--orange');
    expect(component.getTypeClass('refund')).toContain('type-badge--purple');
    expect(component.getTypeClass('welcome_bonus')).toContain('type-badge--green');
    expect(component.getTypeClass('admin_adjustment')).toContain('type-badge--teal');
  });

  it('should identify session_payment and escrow_lock as outgoing types', () => {
    expect(component.isOutgoing('session_payment')).toBeTrue();
    expect(component.isOutgoing('escrow_lock')).toBeTrue();
  });

  it('should identify refund and welcome_bonus as incoming types', () => {
    expect(component.isOutgoing('refund')).toBeFalse();
    expect(component.isOutgoing('welcome_bonus')).toBeFalse();
    expect(component.isOutgoing('admin_adjustment')).toBeFalse();
  });

  it('should return negative amount class for outgoing types', () => {
    expect(component.getAmountClass('session_payment')).toContain('amount--negative');
  });

  it('should return positive amount class for incoming types', () => {
    expect(component.getAmountClass('refund')).toContain('amount--positive');
  });

  it('should format amounts with minus sign for outgoing types', () => {
    expect(component.formatAmount(150, 'session_payment')).toBe('-150 TC');
  });

  it('should format amounts with plus sign for incoming types', () => {
    expect(component.formatAmount(200, 'refund')).toBe('+200 TC');
  });

  it('should generate correct page array', () => {
    component.totalPages.set(3);
    expect(component.getPages()).toEqual([1, 2, 3]);
  });

  // ── Admin Adjustment ──

  it('should open adjustment modal with empty form', () => {
    component.openAdjustModal();
    expect(component.showAdjustModal()).toBeTrue();
    expect(component.adjustForm()).toEqual({ userId: '', amount: 0, description: '' });
  });

  it('should close adjustment modal', () => {
    component.showAdjustModal.set(true);
    component.closeAdjustModal();
    expect(component.showAdjustModal()).toBeFalse();
  });

  it('should update adjustment form field', () => {
    component.updateAdjustForm('userId', 'USR-001');
    expect(component.adjustForm().userId).toBe('USR-001');
  });

  it('should set error when userId is empty on submit', () => {
    component.adjustForm.set({ userId: '', amount: 50, description: 'Reason here' });
    component.onSubmitAdjustment();
    expect(component.adjustError()).toBe('User ID is required.');
    expect(serviceSpy.adminAdjustment).not.toHaveBeenCalled();
  });

  it('should set error when amount is zero on submit', () => {
    component.adjustForm.set({ userId: 'USR-001', amount: 0, description: 'Reason here' });
    component.onSubmitAdjustment();
    expect(component.adjustError()).toBe('Amount must be a non-zero number.');
    expect(serviceSpy.adminAdjustment).not.toHaveBeenCalled();
  });

  it('should set error when description is too short', () => {
    component.adjustForm.set({ userId: 'USR-001', amount: 50, description: 'Hi' });
    component.onSubmitAdjustment();
    expect(component.adjustError()).toBe('Description must be at least 5 characters.');
    expect(serviceSpy.adminAdjustment).not.toHaveBeenCalled();
  });

  it('should call adminAdjustment with trimmed payload and reload on success', fakeAsync(() => {
    serviceSpy.adminAdjustment.and.returnValue(of(mockTx));
    component.adjustForm.set({ userId: '  USR-001  ', amount: 50, description: '  Manual top-up  ' });
    component.showAdjustModal.set(true);

    component.onSubmitAdjustment();
    tick();

    expect(serviceSpy.adminAdjustment).toHaveBeenCalledWith({
      userId: 'USR-001',
      amount: 50,
      description: 'Manual top-up',
    });
    expect(component.showAdjustModal()).toBeFalse();
    expect(component.adjustLoading()).toBeFalse();
  }));

  it('should fall back to mock transaction on error when usingMock is true', fakeAsync(() => {
    component.usingMock.set(true);
    serviceSpy.adminAdjustment.and.returnValue(throwError(() => new Error('error')));
    component.adjustForm.set({ userId: 'USR-001', amount: 30, description: 'Penalty applied' });

    component.onSubmitAdjustment();
    tick();

    expect(component.showAdjustModal()).toBeFalse();
    expect(component.adjustLoading()).toBeFalse();
  }));

  it('should set adjustError on failure when not using mock', fakeAsync(() => {
    serviceSpy.adminAdjustment.and.returnValue(
      throwError(() => ({ error: { message: 'Adjustment would bring the user wallet below zero' } })),
    );
    component.adjustForm.set({ userId: 'USR-001', amount: -9999, description: 'Big penalty' });

    component.onSubmitAdjustment();
    tick();

    expect(component.adjustError()).toBe('Adjustment would bring the user wallet below zero');
    expect(component.adjustLoading()).toBeFalse();
  }));
});

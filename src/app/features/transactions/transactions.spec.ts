import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Transactions } from './transactions';
import { Transactions as TransactionsService } from '../../core/services/transactions';
import { Transaction } from '../../core/models/transaction';

const mockTx = {
  _id: 'TXI-9F00TA',
  from: 'USR-2311',
  to: 'PRV-1045',
  amount: -150,
  type: 'session_payment',
  date: '2025-05-20',
} as unknown as Transaction;

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
    serviceSpy = jasmine.createSpyObj('TransactionsService', ['getAll']);
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
    expect(component.getTypeClass('refund')).toContain('type-badge--green');
    expect(component.getTypeClass('welcome_bonus')).toContain('type-badge--teal');
    expect(component.getTypeClass('admin_adjustment')).toContain('type-badge--purple');
    expect(component.getTypeClass('credit_adjust')).toContain('type-badge--orange');
  });

  it('should return negative amount class for negative values', () => {
    expect(component.getAmountClass(-150)).toContain('amount--negative');
  });

  it('should return positive amount class for positive values', () => {
    expect(component.getAmountClass(200)).toContain('amount--positive');
  });

  it('should format amounts correctly', () => {
    expect(component.formatAmount(-150)).toBe('-150 TC');
    expect(component.formatAmount(200)).toBe('+200 TC');
  });

  it('should generate correct page array', () => {
    component.totalPages.set(3);
    expect(component.getPages()).toEqual([1, 2, 3]);
  });
});

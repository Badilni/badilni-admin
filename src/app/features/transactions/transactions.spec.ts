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
  type: 'debit',
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
    expect(component.getTypeClass('credit')).toContain('type-badge--green');
    expect(component.getTypeClass('debit')).toContain('type-badge--blue');
    expect(component.getTypeClass('escrow_hold')).toContain('type-badge--orange');
    expect(component.getTypeClass('escrow_release')).toContain('type-badge--teal');
    expect(component.getTypeClass('refund')).toContain('type-badge--purple');
  });

  it('should identify debit and escrow_hold as outgoing types', () => {
    expect(component.isOutgoing('debit')).toBeTrue();
    expect(component.isOutgoing('escrow_hold')).toBeTrue();
  });

  it('should identify credit, refund, escrow_release as incoming types', () => {
    expect(component.isOutgoing('credit')).toBeFalse();
    expect(component.isOutgoing('refund')).toBeFalse();
    expect(component.isOutgoing('escrow_release')).toBeFalse();
  });

  it('should return negative amount class for outgoing types', () => {
    expect(component.getAmountClass('debit')).toContain('amount--negative');
  });

  it('should return positive amount class for incoming types', () => {
    expect(component.getAmountClass('credit')).toContain('amount--positive');
  });

  it('should format amounts with minus sign for outgoing types', () => {
    expect(component.formatAmount(150, 'debit')).toBe('-150 TC');
  });

  it('should format amounts with plus sign for incoming types', () => {
    expect(component.formatAmount(200, 'refund')).toBe('+200 TC');
  });

  it('should generate correct page array', () => {
    component.totalPages.set(3);
    expect(component.getPages()).toEqual([1, 2, 3]);
  });
});

import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Disputes } from './disputes';
import { Disputes as DisputesService } from '../../core/services/disputes';
import { Booking } from '../../core/models/booking';

const mockBooking: Booking = {
  _id: 'BK5-7P3A',
  provider: 'Provider A',
  receiver: 'User 2311',
  listing: 'Graphic Design',
  creditsTotal: 150,
  durationHours: 1,
  scheduledAt: '2025-06-05T10:00:00Z',
  status: 'disputed',
  createdAt: '2025-05-31',
};

const mockResponse = {
  status: 'success',
  data: { disputes: [mockBooking] },
  pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 },
};

describe('Disputes Component', () => {
  let component: Disputes;
  let fixture: ComponentFixture<Disputes>;
  let serviceSpy: jasmine.SpyObj<DisputesService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('DisputesService', ['getAll', 'resolve']);
    serviceSpy.getAll.and.returnValue(of(mockResponse));
    serviceSpy.resolve.and.returnValue(of(mockBooking));

    await TestBed.configureTestingModule({
      imports: [Disputes],
      providers: [{ provide: DisputesService, useValue: serviceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Disputes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load disputes on init', fakeAsync(() => {
    tick();
    expect(component.disputes().length).toBe(1);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should fall back to mock data on API error', fakeAsync(() => {
    serviceSpy.getAll.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    tick();
    expect(component.disputes().length).toBeGreaterThan(0);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should open resolve panel with correct dispute', () => {
    component.openResolvePanel(mockBooking);
    expect(component.showPanel()).toBeTrue();
    expect(component.selectedDispute()?._id).toBe('BK5-7P3A');
    expect(component.resolution()).toBe('favor_provider');
    expect(component.reason()).toBe('');
  });

  it('should close panel on closePanel()', () => {
    component.openResolvePanel(mockBooking);
    component.closePanel();
    expect(component.showPanel()).toBeFalse();
    expect(component.selectedDispute()).toBeNull();
  });

  it('should not resolve when reason is empty', fakeAsync(() => {
    component.openResolvePanel(mockBooking);
    component.setReason('');
    component.onConfirmResolve();
    tick();
    expect(serviceSpy.resolve).not.toHaveBeenCalled();
  }));

  it('should call resolve service with correct payload', fakeAsync(() => {
    component.openResolvePanel(mockBooking);
    component.setResolution('favor_receiver');
    component.setReason('Provider was at fault');
    component.onConfirmResolve();
    tick();
    expect(serviceSpy.resolve).toHaveBeenCalledWith('BK5-7P3A', {
      resolution: 'favor_receiver',
      reason: 'Provider was at fault',
    });
  }));

  it('should close panel and reload after resolve success', fakeAsync(() => {
    component.openResolvePanel(mockBooking);
    component.setReason('Valid reason');
    component.onConfirmResolve();
    tick();
    expect(component.showPanel()).toBeFalse();
    expect(serviceSpy.getAll).toHaveBeenCalledTimes(2);
  }));

  it('should set resolution correctly', () => {
    component.setResolution('split');
    expect(component.resolution()).toBe('split');
  });

  it('should set reason correctly', () => {
    component.setReason('Test reason');
    expect(component.reason()).toBe('Test reason');
  });

  it('should not navigate below page 1', () => {
    component.currentPage.set(1);
    component.onPageChange(0);
    expect(component.currentPage()).toBe(1);
  });

  it('should generate correct page array', () => {
    component.totalPages.set(3);
    expect(component.getPages()).toEqual([1, 2, 3]);
  });
});

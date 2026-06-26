import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { Notifications } from './notifications';
import { NotificationsService } from '../../core/services/notifications';
import { Notification } from '../../core/models/notification';

const mockNotif: Notification = {
  _id: 'N001', title: 'System Update',
  message: 'Maintenance', type: 'system', target: 'broadcast',
};

const mockResponse = {
  status: 'success',
  data: { notifications: [mockNotif] },
  pagination: { page: 1, limit: 10, totalCount: 1, totalPages: 1 },
};

describe('Notifications Component', () => {
  let component: Notifications;
  let fixture: ComponentFixture<Notifications>;
  let serviceSpy: jasmine.SpyObj<NotificationsService>;

  beforeEach(async () => {
    serviceSpy = jasmine.createSpyObj('NotificationsService', ['getAll', 'send', 'delete']);
    serviceSpy.getAll.and.returnValue(of(mockResponse));
    serviceSpy.send.and.returnValue(of(mockNotif));
    serviceSpy.delete.and.returnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [Notifications],
      providers: [{ provide: NotificationsService, useValue: serviceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(Notifications);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load notifications on init', fakeAsync(() => {
    tick();
    expect(component.notifications().length).toBe(1);
    expect(component.isLoading()).toBeFalse();
  }));

  it('should fall back to mock data on API error', fakeAsync(() => {
    serviceSpy.getAll.and.returnValue(throwError(() => new Error('error')));
    component.ngOnInit();
    tick();
    expect(component.notifications().length).toBeGreaterThan(0);
  }));

  it('should set formError when title is empty on send', () => {
    component.formTitle.set('');
    component.formMessage.set('Test message');
    component.onSend();
    expect(component.formError()).toBeTruthy();
    expect(serviceSpy.send).not.toHaveBeenCalled();
  });

  it('should set formError when message is empty on send', () => {
    component.formTitle.set('Test Title');
    component.formMessage.set('');
    component.onSend();
    expect(component.formError()).toBeTruthy();
  });

  it('should set formError when target is user but userId is empty', () => {
    component.formTitle.set('Title');
    component.formMessage.set('Message');
    component.formTarget.set('user');
    component.formUserId.set('');
    component.onSend();
    expect(component.formError()).toBeTruthy();
  });

  it('should call send service with valid broadcast payload', fakeAsync(() => {
    component.formTitle.set('Hello');
    component.formMessage.set('World');
    component.formTarget.set('broadcast');
    component.formType.set('info');
    component.onSend();
    tick();
    expect(serviceSpy.send).toHaveBeenCalledWith(jasmine.objectContaining({
      title: 'Hello', message: 'World', target: 'broadcast', type: 'info',
    }));
  }));

  it('should include userId in payload when target is user', fakeAsync(() => {
    component.formTitle.set('Reminder');
    component.formMessage.set('Pay now');
    component.formTarget.set('user');
    component.formUserId.set('USR-001');
    component.onSend();
    tick();
    expect(serviceSpy.send).toHaveBeenCalledWith(jasmine.objectContaining({
      userId: 'USR-001',
    }));
  }));

  it('should reset form after successful send', fakeAsync(() => {
    component.formTitle.set('Title');
    component.formMessage.set('Msg');
    component.onSend();
    tick();
    expect(component.formTitle()).toBe('');
    expect(component.formMessage()).toBe('');
  }));

  it('should cancel and reset form on closeSendModal()', () => {
    component.formTitle.set('Test');
    component.showSendModal.set(true);
    component.closeSendModal();
    expect(component.formTitle()).toBe('');
    expect(component.showSendModal()).toBeFalse();
  });

  it('should return correct type badge classes', () => {
    expect(component.getTypeClass('system')).toContain('type-badge--gray');
    expect(component.getTypeClass('warning')).toContain('type-badge--yellow');
    expect(component.getTypeClass('info')).toContain('type-badge--blue');
    expect(component.getTypeClass('success')).toContain('type-badge--green');
  });

  it('should return correct target badge classes', () => {
    expect(component.getTargetClass('broadcast')).toContain('target-badge--broadcast');
    expect(component.getTargetClass('user')).toContain('target-badge--user');
  });

  it('should call delete and reload on onDelete()', fakeAsync(() => {
    component.onDelete('N001');
    tick();
    expect(serviceSpy.delete).toHaveBeenCalledWith('N001');
  }));
});

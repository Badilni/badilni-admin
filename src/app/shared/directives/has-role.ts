import {
  Directive,
  Input,
  OnInit,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { Auth } from '../../core/services/auth';

@Directive({
  selector: '[appHasRole]',
})
export class HasRole implements OnInit {
  @Input() appHasRole: ('user' | 'admin') | ('user' | 'admin')[] = [];

  private hasView = false;

  constructor(
    private templateRef: TemplateRef<unknown>,
    private viewContainer: ViewContainerRef,
    private authService: Auth,
  ) {}

  ngOnInit(): void {
    this.updateView();
  }

  private updateView(): void {
    const allowedRoles = Array.isArray(this.appHasRole)
      ? this.appHasRole
      : [this.appHasRole];

    const currentRole = this.authService.currentUser()?.role;
    const isAllowed = !!currentRole && allowedRoles.includes(currentRole);

    if (isAllowed && !this.hasView) {
      this.viewContainer.createEmbeddedView(this.templateRef);
      this.hasView = true;
    } else if (!isAllowed && this.hasView) {
      this.viewContainer.clear();
      this.hasView = false;
    }
  }
}

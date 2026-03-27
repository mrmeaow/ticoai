import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
} from '@angular/core';
import { PermissionService } from '../../core/services/permission.service';

@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private permissionService = inject(PermissionService);
  private templateRef = inject(TemplateRef);
  private viewContainer = inject(ViewContainerRef);

  @Input()
  set hasPermission(permission: string | string[]) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const hasPermission = permissions.every(p => this.permissionService.hasPermission(p));

    if (hasPermission) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}

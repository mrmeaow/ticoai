import { SetMetadata } from '@nestjs/common';

export const PermissionsKey = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PermissionsKey, permissions);

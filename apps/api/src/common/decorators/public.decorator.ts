import { SetMetadata } from '@nestjs/common';

export const PublicKey = 'public';
export const Public = () => SetMetadata(PublicKey, true);

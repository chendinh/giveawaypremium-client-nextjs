import * as path from 'path';

export enum EMAIL_TYPES {
  CONSIGNMENT = 'CONSIGNMENT',
  PAYMENT = 'PAYMENT',
}

export const EMAIL_PATHS: Record<string, string> = {
  [EMAIL_TYPES.CONSIGNMENT]: path.join(process.cwd(), 'src/server/templates/email/consignment.ejs'),
  [EMAIL_TYPES.PAYMENT]: path.join(process.cwd(), 'src/server/templates/email/payment.ejs'),
};

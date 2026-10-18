import type { LoginFields } from './login-fields';

// Reuses username and password type from LoginFields,
// then adds the information needed to create an account.
export type CreateAccountFields = LoginFields & {
    
  // Email address for the new account.
  email: string;

  // The person's name.
  name: string;

  // Must match password to catch typing mistakes.
  // Used only by the form; not saved to the account.
  confirmPassword: string;
};
import type { LoginFields } from './login-fields';

// Reuses email and password type from LoginFields,
// then adds the information needed to create an account.
export type CreateAccountFields = LoginFields & {

  // The person's name.
  name: string;

  // Shown on their profile as @username. No two accounts can share one.
  username: string;

  // Must match password to catch typing mistakes.
  // Used only by the form; not saved to the account.
  confirmPassword: string;
};
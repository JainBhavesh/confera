import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword, isPasswordStrongEnough } from './password';

describe('password', () => {
  it('hashes and verifies a matching password', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    await expect(verifyPassword('correct-horse-battery-staple', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password against a hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    await expect(verifyPassword('wrong-password', hash)).resolves.toBe(false);
  });

  it('never stores the plaintext password in the hash', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(hash).not.toContain('correct-horse-battery-staple');
  });

  it('enforces a minimum password length', () => {
    expect(isPasswordStrongEnough('short')).toBe(false);
    expect(isPasswordStrongEnough('longenough1')).toBe(true);
  });
});

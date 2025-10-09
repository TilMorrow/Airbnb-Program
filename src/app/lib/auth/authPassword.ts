'use server'

import bcrypt from 'bcryptjs';

export async function hashPasswordAction(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPasswordAction(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
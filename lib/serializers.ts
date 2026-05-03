export function toPublicUser<T extends { passwordHash?: string }>(user: T) {
  const publicUser = { ...user };
  delete publicUser.passwordHash;
  return publicUser;
}

export function normalizeDateInput(value: Date | null | undefined) {
  return value ?? undefined;
}

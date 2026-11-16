export function getAdminPassword(): string {
  return (process.env.ADMIN_PASSWORD || "prakash2026").trim();
}

export function verifyAdminPassword(password: string): boolean {
  if (!password) return false;
  const actualPassword = getAdminPassword();
  return Boolean(actualPassword && password.trim() === actualPassword);
}

export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "";
}

export function verifyAdminPassword(password: string): boolean {
  const actualPassword = getAdminPassword();
  return Boolean(password && actualPassword && password === actualPassword);
}

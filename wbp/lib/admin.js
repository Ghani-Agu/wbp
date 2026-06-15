// Returns the list of admin emails from env (comma-separated).
export function adminEmails() {
  return (process.env.ADMIN_EMAILS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
}
export function isAdminEmail(email) {
  if (!email) return false;
  const list = adminEmails();
  return list.length === 0 ? false : list.includes(String(email).toLowerCase());
}

type AdminSession = { access_token: string; user: { id: string } };

export async function verifyAdminSession(
  expectedUserId: string,
  getSession: () => Promise<AdminSession | null>,
  currentUserId: () => string | undefined,
  invoke: (token: string) => Promise<boolean>,
): Promise<boolean> {
  const session = await getSession();
  if (!session?.access_token || session.user.id !== expectedUserId || currentUserId() !== expectedUserId) {
    return false;
  }
  const isAdmin = await invoke(session.access_token);
  return currentUserId() === expectedUserId && isAdmin;
}
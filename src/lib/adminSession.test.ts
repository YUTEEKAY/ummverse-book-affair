// @ts-ignore -- Tests run with Bun.
import { test, expect } from 'bun:test';
import { verifyAdminSession } from './adminSession';

test('signed-out sessions never invoke the admin endpoint', async () => {
  let calls = 0;
  const result = await verifyAdminSession('admin', async () => null, () => undefined, async () => { calls++; return true; });
  expect(result).toBe(false);
  expect(calls).toBe(0);
});

test('admin checks send the current session token', async () => {
  let sentToken = '';
  const result = await verifyAdminSession('admin', async () => ({ access_token: 'current-token', user: { id: 'admin' } }), () => 'admin', async (token) => { sentToken = token; return true; });
  expect(sentToken).toBe('current-token');
  expect(result).toBe(true);
});

test('signing out while a check is pending discards the admin result', async () => {
  let currentId: string | undefined = 'admin';
  const result = await verifyAdminSession('admin', async () => ({ access_token: 'token', user: { id: 'admin' } }), () => currentId, async () => { currentId = undefined; return true; });
  expect(result).toBe(false);
});

test('a different account cannot reuse a pending admin check', async () => {
  let calls = 0;
  const result = await verifyAdminSession('admin', async () => ({ access_token: 'reader-token', user: { id: 'reader' } }), () => 'reader', async () => { calls++; return true; });
  expect(result).toBe(false);
  expect(calls).toBe(0);
});
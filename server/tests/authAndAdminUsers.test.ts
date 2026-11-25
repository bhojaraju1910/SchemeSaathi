import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app';
import { inMemoryDB, ProfileModel } from '../src/models/index';

test('auth register, login validation, and admin user listing/deletion endpoints work end-to-end', async () => {
  inMemoryDB.users.clear();
  inMemoryDB.profiles.clear();
  inMemoryDB.schemes.clear();
  inMemoryDB.criteria.clear();

  const adminHash = await bcrypt.hash('Admin@123', 10);
  inMemoryDB.users.set('admin_1', {
    _id: 'admin_1',
    name: 'Administrator',
    email: 'admin@schemesaathi.test',
    passwordHash: adminHash,
    role: 'admin',
    preferredLanguage: 'en',
    createdAt: new Date(),
  });

  const app = createApp();
  const server = app.listen(0);

  try {
    const addr = server.address();
    assert.ok(addr && typeof addr === 'object');
    const base = `http://127.0.0.1:${addr.port}/api`;

    // 1. Register a brand new user
    const regRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kiran Shetty',
        email: 'Kiran.Shetty@Example.com',
        password: 'Password@123',
        preferredLanguage: 'kn',
      }),
    });
    assert.equal(regRes.status, 201);
    const regJson = (await regRes.json()) as any;
    assert.ok(regJson.token);
    assert.equal(regJson.user.email, 'kiran.shetty@example.com');
    assert.equal(regJson.user.role, 'user');
    assert.equal(regJson.user.preferredLanguage, 'kn');

    // Profile should be auto-created
    const profile = await ProfileModel.findOne({ userId: regJson.user.id });
    assert.ok(profile);
    assert.equal(profile.state, 'Karnataka');

    // 2. Duplicate registration returns 400
    const dupRes = await fetch(`${base}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate',
        email: 'kiran.shetty@example.com',
        password: 'Password@123',
      }),
    });
    assert.equal(dupRes.status, 400);

    // 3. NoSQL operator injection payload in login is rejected cleanly with 400
    const injectRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: { $gt: '' },
        password: { $ne: '' },
      }),
    });
    assert.equal(injectRes.status, 400);

    // 4. Standard user cannot access /api/admin/users
    const userListForbidden = await fetch(`${base}/admin/users`, {
      headers: { Authorization: `Bearer ${regJson.token}` },
    });
    assert.equal(userListForbidden.status, 403);

    // 5. Admin logs in and lists users (no passwordHash leaked)
    const adminLoginRes = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@schemesaathi.test',
        password: 'Admin@123',
      }),
    });
    assert.equal(adminLoginRes.status, 200);
    const adminLoginJson = (await adminLoginRes.json()) as any;
    assert.ok(adminLoginJson.token);

    const listRes = await fetch(`${base}/admin/users`, {
      headers: { Authorization: `Bearer ${adminLoginJson.token}` },
    });
    assert.equal(listRes.status, 200);
    const listJson = (await listRes.json()) as any;
    assert.equal(listJson.total, 2);
    assert.ok(listJson.users.some((u: any) => u.email === 'kiran.shetty@example.com'));
    for (const u of listJson.users) {
      assert.equal('passwordHash' in u, false);
    }

    // 6. Admin cannot delete self, can delete registered non-admin user
    const selfDelRes = await fetch(`${base}/admin/users/admin_1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminLoginJson.token}` },
    });
    assert.equal(selfDelRes.status, 400);

    const delRes = await fetch(`${base}/admin/users/${regJson.user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminLoginJson.token}` },
    });
    assert.equal(delRes.status, 200);

    const afterListRes = await fetch(`${base}/admin/users`, {
      headers: { Authorization: `Bearer ${adminLoginJson.token}` },
    });
    const afterListJson = (await afterListRes.json()) as any;
    assert.equal(afterListJson.total, 1);
    assert.equal(afterListJson.users[0].email, 'admin@schemesaathi.test');
  } finally {
    server.close();
  }
});

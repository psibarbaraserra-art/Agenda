'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { createApi } = require('../lib/api');

function memoryApi() {
  let db = null; let n = 0;
  const store = {
    load: () => db || (db = { users: [], sessions: [], settings: {}, companies: [], deliveries: [], materials: [], campaigns: [], responses: [], feedback: [] }),
    save: () => {}, id: () => 'id' + (++n), token: () => 'tk' + (++n)
  };
  const api = createApi({ store, hashPassword: (pw, salt = 's') => ({ salt, hash: salt + pw }), checkPassword: (pw, u) => u.hash === u.salt + pw });
  const ctx = { userId: null, ip: 'x', login(id) { ctx.userId = id; }, logout() { ctx.userId = null; } };
  const call = (method, path, body) => api.handle({ method, path, body, query: {} }, ctx);
  return { call, ctx };
}

test('cópia de segurança: baixar e restaurar devolve os dados', async () => {
  const { call } = memoryApi();
  await call('POST', '/api/setup', { name: 'Consultora', email: 'a@b.c', password: '12345678' });
  const co = (await call('POST', '/api/companies', { name: 'Empresa X' })).body;
  await call('POST', '/api/campaigns', { companyId: co.id });
  const backup = (await call('GET', '/api/backup')).body;
  assert.strictEqual(backup.app, 'mindcorp');
  assert.strictEqual(backup.data.companies.length, 1);
  assert.ok(!('sessions' in backup.data));

  await call('DELETE', `/api/companies/${co.id}`);
  assert.strictEqual((await call('GET', '/api/companies')).body.length, 0);

  const r = await call('POST', '/api/backup/restore', JSON.parse(JSON.stringify(backup)));
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.body.loggedOut, false);
  assert.strictEqual(r.body.counts.companies, 1);
  assert.strictEqual(r.body.counts.campaigns, 1);
  assert.strictEqual((await call('GET', '/api/companies')).body[0].name, 'Empresa X');
});

test('restauração recusa arquivos inválidos sem mexer nos dados', async () => {
  const { call } = memoryApi();
  await call('POST', '/api/setup', { name: 'Consultora', email: 'a@b.c', password: '12345678' });
  await call('POST', '/api/companies', { name: 'Empresa X' });
  for (const bad of [{}, { app: 'outro', data: {} }, { app: 'mindcorp', data: { companies: [] } }]) {
    const r = await call('POST', '/api/backup/restore', bad);
    assert.strictEqual(r.status, 400);
  }
  assert.strictEqual((await call('GET', '/api/companies')).body.length, 1);
});

test('rotas da consultora exigem login', async () => {
  const { call } = memoryApi();
  assert.strictEqual((await call('GET', '/api/backup')).status, 401);
  assert.strictEqual((await call('POST', '/api/backup/restore', {})).status, 401);
});

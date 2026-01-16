const { SecureDB } = require('./node_secure_db');

beforeAll(async () => {
  // ensure clean DB state
  try { await SecureDB.deleteTest('clinic_settings'); } catch (e) {}
});

test('saveTest handles multiple dates and duplicate detection', async () => {
  // Setup and login
  await SecureDB.setupPassword('node-pass');
  await SecureDB.login('node-pass');

  const base = {
    patientName: 'Node Patient',
    cNumber: 'NP-001',
    dateOfBirth: '1990-01-01',
    tests: { A: { id: 'A', scores: {} }, B: { id: 'B', scores: {} } },
    activeTestId: 'A',
    activeTab: 'scoring',
    confidenceLevel: 5
  };

  const id1 = await SecureDB.saveTest({ ...base, testDate: '2024-03-01' });
  expect(id1).toBeDefined();

  const id2 = await SecureDB.saveTest({ ...base, testDate: '2024-04-01' });
  expect(id2).toBeDefined();
  expect(id2).not.toEqual(id1);

  // attempt duplicate
  let dupErr = null;
  try {
    await SecureDB.saveTest({ ...base, testDate: '2024-03-01' });
  } catch (e) {
    dupErr = e;
  }
  expect(dupErr).toBeTruthy();
  expect(dupErr.code).toBe('DUPLICATE_DATE');

  // overwrite
  const overwriteId = await SecureDB.saveTest({ ...base, testDate: '2024-03-01' }, { overwriteExistingSameDate: true });
  expect(overwriteId).toBeDefined();
});

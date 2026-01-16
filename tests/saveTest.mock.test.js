const { SecureDB } = require('./mock_secure_db');

test('mock saveTest multiple dates and duplicate detection', async () => {
  await SecureDB.setupPassword('mock-pass');
  await SecureDB.login('mock-pass');

  const base = { patientName: 'Mock Patient', cNumber: 'MP-001' };

  const id1 = await SecureDB.saveTest({ ...base, testDate: '2024-05-01' });
  expect(id1).toBeDefined();

  const id2 = await SecureDB.saveTest({ ...base, testDate: '2024-06-01' });
  expect(id2).toBeDefined();
  expect(id2).not.toEqual(id1);

  // duplicate should throw
  const all = await SecureDB.getAllTests();
  expect(all.length).toBeGreaterThanOrEqual(2);
  const found = all.find(r => r.testDate === '2024-05-01');
  expect(found).toBeDefined();

  let threw = false;
  try {
    await SecureDB.saveTest({ ...base, testDate: '2024-05-01' });
  } catch (e) { threw = true; expect(e.code).toBe('DUPLICATE_DATE'); }
  if (!threw) throw new Error('Expected duplicate save to throw, but it did not. Records: ' + JSON.stringify(all));

  // overwrite
  const overwriteId = await SecureDB.saveTest({ ...base, testDate: '2024-05-01' }, { overwriteExistingSameDate: true });
  expect(overwriteId).toBeDefined();
});

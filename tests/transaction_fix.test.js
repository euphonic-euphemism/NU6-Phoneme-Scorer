// Test to verify the IndexedDB transaction fix
const { SecureDB } = require('./mock_secure_db');

test('saveTest works without transaction timeout errors', async () => {
  await SecureDB.setupPassword('test-pass');
  await SecureDB.login('test-pass');

  const testData = {
    patientName: 'Transaction Test Patient',
    cNumber: 'TTP-001',
    dateOfBirth: '1985-05-15',
    testDate: '2024-12-01',
    tests: { A: { id: 'A', scores: {} } },
    activeTestId: 'A',
    activeTab: 'scoring',
    confidenceLevel: 5
  };

  // First save should succeed
  const id1 = await SecureDB.saveTest(testData);
  expect(id1).toBeDefined();
  expect(typeof id1).toBe('string');

  // Save with different date should succeed
  const testData2 = { ...testData, testDate: '2024-12-02' };
  const id2 = await SecureDB.saveTest(testData2);
  expect(id2).toBeDefined();
  expect(id2).not.toEqual(id1);

  // Update existing record should succeed
  const testData3 = { ...testData, id: id1, patientName: 'Updated Name' };
  const id3 = await SecureDB.saveTest(testData3);
  expect(id3).toBe(id1);

  // Verify all records were saved
  const allTests = await SecureDB.getAllTests();
  expect(allTests.length).toBeGreaterThanOrEqual(2);
});

test('duplicate date detection still works after fix', async () => {
  await SecureDB.setupPassword('test-pass2');
  await SecureDB.login('test-pass2');

  const testData = {
    patientName: 'Duplicate Test Patient',
    cNumber: 'DTP-001',
    testDate: '2024-11-15',
    tests: { A: { id: 'A', scores: {} } },
    activeTestId: 'A',
    activeTab: 'scoring'
  };

  // First save
  const id1 = await SecureDB.saveTest(testData);
  expect(id1).toBeDefined();

  // Duplicate should throw
  let error;
  try {
    await SecureDB.saveTest(testData);
  } catch (e) {
    error = e;
  }
  expect(error).toBeDefined();
  expect(error.code).toBe('DUPLICATE_DATE');

  // Overwrite should succeed
  const id2 = await SecureDB.saveTest(testData, { overwriteExistingSameDate: true });
  expect(id2).toBeDefined();
});

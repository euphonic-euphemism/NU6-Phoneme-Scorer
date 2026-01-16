const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');

jest.setTimeout(60000);

const pageHtml = 'file://' + path.resolve(__dirname, '..', 'nu6_scoring_app.html');

describe('SecureDB.saveTest integration', () => {
  let browser, page;

    beforeAll(async () => {
    browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    page = await browser.newPage();
    await page.goto(pageHtml, { waitUntil: 'load' });
  });

  afterAll(async () => {
    if (browser) await browser.close();
  });

  test('saves multiple dated sessions and rejects same-date duplicate unless overwritten', async () => {
    // Wait for SecureDB to be available
    // allow up to 60s for all scripts to initialize
    await page.waitForFunction('window.SecureDB && window.CryptoService', { timeout: 60000 });
    await page.waitForTimeout(500);

    // Setup a password
    await page.evaluate(async () => {
      if (!await window.SecureDB.isSetup()) {
        await window.SecureDB.setupPassword('test-pass');
      }
      await window.SecureDB.login('test-pass');
    });

    const base = {
      patientName: 'Test Patient',
      cNumber: 'TP-001',
      dateOfBirth: '1980-01-01',
      tests: { A: { id: 'A', scores: {} }, B: { id: 'B', scores: {} } },
      activeTestId: 'A',
      activeTab: 'scoring',
      confidenceLevel: 5
    };

    // Save record for date1
    const date1 = '2024-01-01';
    const id1 = await page.evaluate(async (data) => {
      return await window.SecureDB.saveTest({ ...data, testDate: '2024-01-01' });
    }, base);
    expect(id1).toBeTruthy();

    // Save record for date2 (different date) - should succeed and return a new id
    const id2 = await page.evaluate(async (data) => {
      return await window.SecureDB.saveTest({ ...data, testDate: '2024-02-01' });
    }, base);
    expect(id2).toBeTruthy();
    expect(id2).not.toEqual(id1);

    // Attempt to save another record on date1 - should reject with DUPLICATE_DATE
    const dupResult = await page.evaluate(async (data) => {
      try {
        await window.SecureDB.saveTest({ ...data, testDate: '2024-01-01' });
        return { ok: true };
      } catch (e) {
        return { ok: false, code: e.code || null, existingId: e.existingId || null };
      }
    }, base);
    expect(dupResult.ok).toBe(false);
    expect(dupResult.code).toBe('DUPLICATE_DATE');

    // Now overwrite existing date1 using options
    const overwriteResult = await page.evaluate(async (data) => {
      try {
        const saved = await window.SecureDB.saveTest({ ...data, testDate: '2024-01-01' }, { overwriteExistingSameDate: true });
        return { ok: true, id: saved };
      } catch (e) { return { ok: false, error: String(e) }; }
    }, base);
    expect(overwriteResult.ok).toBe(true);
  });
});

// Test TNT significance calculation
const { SecureDB } = require('./mock_secure_db');

test('TNT significance correctly identifies differences > 1.5 dB', () => {
  // Helper function to parse TNT (mirrors app logic)
  const parseTNT = (tntString) => {
    if (!tntString) return null;
    const match = tntString.match(/([+-]?\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  };

  // Test various TNT differences
  const testCases = [
    { tntA: '5 dB', tntB: '7 dB', expectedSig: true, desc: '2 dB difference (significant)' },
    { tntA: '5 dB', tntB: '6 dB', expectedSig: false, desc: '1 dB difference (not significant)' },
    { tntA: '5.0 dB', tntB: '6.6 dB', expectedSig: true, desc: '1.6 dB difference (significant)' },
    { tntA: '5.0 dB', tntB: '6.5 dB', expectedSig: false, desc: '1.5 dB difference (not significant - must be > 1.5)' },
    { tntA: '8 dB', tntB: '6 dB', expectedSig: true, desc: '-2 dB difference (significant, absolute value)' },
    { tntA: '5 dB', tntB: '', expectedSig: false, desc: 'Missing TNT B (not applicable)' },
    { tntA: '', tntB: '5 dB', expectedSig: false, desc: 'Missing TNT A (not applicable)' },
  ];

  testCases.forEach(({ tntA, tntB, expectedSig, desc }) => {
    const valA = parseTNT(tntA);
    const valB = parseTNT(tntB);
    const difference = (valA !== null && valB !== null) ? Math.abs(valB - valA) : null;
    const isSignificant = difference !== null && difference > 1.5;
    
    expect(isSignificant).toBe(expectedSig);
    console.log(`✓ ${desc}: ${tntA} vs ${tntB} = ${difference !== null ? difference.toFixed(2) + ' dB' : 'N/A'} (${isSignificant ? 'Significant' : 'Not Significant'})`);
  });
});

test('TNT parsing handles various formats', () => {
  const parseTNT = (tntString) => {
    if (!tntString) return null;
    const match = tntString.match(/([+-]?\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : null;
  };

  expect(parseTNT('5 dB')).toBe(5);
  expect(parseTNT('5.5 dB')).toBe(5.5);
  expect(parseTNT('5.5dB')).toBe(5.5);
  expect(parseTNT('5.5')).toBe(5.5);
  expect(parseTNT('+5 dB')).toBe(5);
  expect(parseTNT('-5 dB')).toBe(-5);
  expect(parseTNT('')).toBe(null);
  expect(parseTNT(null)).toBe(null);
  expect(parseTNT('N/A')).toBe(null);
});

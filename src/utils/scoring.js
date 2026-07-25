import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../data/wordLists.js';

const BKB_SIN_LISTS_FULL = {};
// --- HELPER FUNCTIONS ---
        // Same list getter, stats calc, critical limits as before
export const getListData = (listId) => {
            switch (listId) { case '1A': return LIST_1A; case '2A': return LIST_2A; case '3A': return LIST_3A; case '4A': return LIST_4A; case 'HF1': return LIST_HF1; case 'HF2': return LIST_HF2; case 'HF3': return LIST_HF3; case 'HF4': return LIST_HF4; default: return LIST_1A; }
        };
export const calculateStats = (listId, section, scores, limitTo10 = false) => {
            if (listId && listId.startsWith('BKB')) {
                const pairId = parseInt(listId.replace('BKB', ''));
                const listData = BKB_SIN_LISTS_FULL[pairId];
                if (!listData) return { isBKB: true, error: "List not found", visibleWords: [] };

                let totalCorrect = 0;
                let countA = 0;
                let countB = 0;

                // Process List A
                const processedListA = listData.listA.map(item => {
                    const key = `${listId}_A_${item.i}`;
                    const score = scores[key];
                    const val = (typeof score === 'number') ? score : 0;
                    countA += val;
                    return { ...item, score: val };
                });

                // Process List B
                const processedListB = listData.listB.map(item => {
                    const key = `${listId}_B_${item.i}`;
                    const score = scores[key];
                    const val = (typeof score === 'number') ? score : 0;
                    countB += val;
                    return { ...item, score: val };
                });

                totalCorrect = countA + countB;
                // BKB-SIN uses average of the pair for the score
                // Formula: 23.5 - (TotalCorrect / 2)
                const snr50 = 23.5 - (totalCorrect / 2);

                return {
                    isBKB: true,
                    pairId,
                    totalCorrect,
                    scoreA: countA,
                    scoreB: countB,
                    snr50,
                    listA: processedListA,
                    listB: processedListB,
                    wordPercent: 0, phonemePercent: 0, totalWords: 0, visibleWords: []
                };
            }
            const allWords = getListData(listId);
            let visibleWords = allWords;
            if (section === 'first') visibleWords = allWords.slice(0, 25);
            else if (section === 'first_10') visibleWords = allWords.slice(0, 10);
            else if (section === 'second') visibleWords = allWords.slice(25, 50);
            else if (section === 'second_10') visibleWords = allWords.slice(25, 35);
            else if (section === 'full') visibleWords = allWords;

            if (limitTo10) { visibleWords = visibleWords.slice(0, 10); }

            let totalPhonemes = 0; let correctPhonemes = 0; let correctWords = 0; let totalWords = visibleWords.length;
            visibleWords.forEach(word => {
                let wordCorrectCount = 0; let wordPhonemeCount = 0;
                word.p.forEach((phoneme, pIndex) => {
                    if (phoneme === '-') return;
                    wordPhonemeCount++; totalPhonemes++;
                    const key = `${listId}_${word.i}_${pIndex}`;
                    if (scores[key]) { correctPhonemes++; wordCorrectCount++; }
                });
                if (wordCorrectCount === wordPhonemeCount && wordPhonemeCount > 0) { correctWords++; }
            });
            return {
                totalPhonemes, correctPhonemes, phonemePercent: totalPhonemes === 0 ? 0 : Math.round((correctPhonemes / totalPhonemes) * 100),
                correctWords, totalWords, wordPercent: totalWords === 0 ? 0 : Math.round((correctWords / totalWords) * 100), visibleWords
            };
        };
export const getTheta = (x, n) => Math.asin(Math.sqrt(x / (n + 1))) + Math.asin(Math.sqrt((x + 1) / (n + 1)));
export const getCriticalLimits = (scorePercent, n, confidence, isPhoneme = false) => {
            const confKey = String(confidence); // "80" or "95"
            let table = null;

            if (isPhoneme) {
                // Determine closest N for phoneme table lookup (30, 75, 150)
                let tableN;
                if (n <= 45) tableN = "30";
                else if (n <= 110) tableN = "75";
                else tableN = "150";

                if (PHONEME_TABLES[confKey]) table = PHONEME_TABLES[confKey][tableN];
            } else {
                // Determine closest N for word table lookup (10, 25, 50)
                let tableN;
                if (n <= 15) tableN = "10";
                else if (n <= 35) tableN = "25";
                else tableN = "50";

                if (WORD_TABLES[confKey]) table = WORD_TABLES[confKey][tableN];
            }

            if (table) {
                // Find exact match or closest key in table
                let bestKey = null;
                let minDiff = Infinity;

                Object.keys(table).forEach(key => {
                    const keyNum = parseFloat(key);
                    const diff = Math.abs(keyNum - scorePercent);
                    if (diff < minDiff) {
                        minDiff = diff;
                        bestKey = key;
                    }
                });

                if (bestKey !== null) {
                    const range = table[bestKey];
                    return { lower: range[0], upper: range[1] };
                }
            }

            // Fallback for edge cases where table lookup might fail (should rarely happen)
            // Default to 0-100 to be safe and obvious that it failed
            console.warn("Table lookup failed for", scorePercent, n, confidence);
            return { lower: 0, upper: 100 };
        };
export const getInterpolatedCriticalLimits = (scorePercent, n, confidence) => {
            let tableN;
            if (n <= 45) tableN = "30";
            else if (n <= 110) tableN = "75";
            else tableN = "150";

            const confKey = String(confidence);
            if (!PHONEME_TABLES[confKey] || !PHONEME_TABLES[confKey][tableN]) return getCriticalLimits(scorePercent, n, confidence, true);

            const table = PHONEME_TABLES[confKey][tableN];
            const keys = Object.keys(table).map(parseFloat).sort((a, b) => a - b);

            // Find neighbors
            let lowerKey = keys[0];
            let upperKey = keys[keys.length - 1];

            for (let i = 0; i < keys.length - 1; i++) {
                if (scorePercent >= keys[i] && scorePercent <= keys[i + 1]) {
                    lowerKey = keys[i];
                    upperKey = keys[i + 1];
                    break;
                }
            }

            if (lowerKey === upperKey) {
                const range = table[String(lowerKey.toFixed(1))] || table[String(lowerKey.toFixed(0))] || table[String(lowerKey)];
                return { lower: range[0], upper: range[1] };
            }

            const rangeLower = table[String(lowerKey.toFixed(1))] || table[String(lowerKey)];
            const rangeUpper = table[String(upperKey.toFixed(1))] || table[String(upperKey)];

            if (!rangeLower || !rangeUpper) return getCriticalLimits(scorePercent, n, confidence, true);

            const ratio = (scorePercent - lowerKey) / (upperKey - lowerKey);
            const interpolatedLower = rangeLower[0] + (rangeUpper[0] - rangeLower[0]) * ratio;
            const interpolatedUpper = rangeLower[1] + (rangeUpper[1] - rangeLower[1]) * ratio;

            return { lower: interpolatedLower, upper: interpolatedUpper };
        };
export function generateData(n, confidence, isPhoneme) {
            const data = [];
            if (isPhoneme) {
                // Interpolate for smooth curves for phonemes
                for (let score = 0; score <= 100; score += 1) {
                    const limits = getInterpolatedCriticalLimits(score, n, confidence);
                    const margin = (limits.upper - limits.lower) / 2;
                    data.push({ x: score, y: margin });
                }
            } else {
                // For Words, maintain discrete steps
                for (let i = 0; i <= n; i++) {
                    const score = (i / n) * 100;
                    const limits = getCriticalLimits(score, n, confidence, false);
                    const margin = (limits.upper - limits.lower) / 2;
                    data.push({ x: score, y: margin });
                }
            }
            return data;
        }

        

export let WORD_TABLES = {};
export let PHONEME_TABLES = {};

export const loadCriticalDifferenceTables = async (confidenceLevel) => {
    try {
        const response = await window.fs.readFile(`word_critical_differences_${confidenceLevel}.csv`, 'utf8');
        const rows = response.trim().split('\n');
        const headers = rows[0].split(',');
        const tables = {};
        for (let i = 1; i < headers.length; i++) {
            tables[headers[i]] = {};
        }
        for (let j = 1; j < rows.length; j++) {
            const cols = rows[j].split(',');
            const score = cols[0];
            for (let i = 1; i < headers.length; i++) {
                if (cols[i]) {
                    const [lower, upper] = cols[i].split('-').map(Number);
                    tables[headers[i]][score] = [lower, upper];
                }
            }
        }
        WORD_TABLES[confidenceLevel] = tables;
    } catch (e) {
        console.error("Failed to load word tables", e);
    }
};

export const loadPhonemeTables = async (confidenceLevel) => {
    try {
        const response = await window.fs.readFile(`phoneme_critical_differences_${confidenceLevel}.csv`, 'utf8');
        const rows = response.trim().split('\n');
        const headers = rows[0].split(',');
        const tables = {};
        for (let i = 1; i < headers.length; i++) {
            tables[headers[i]] = {};
        }
        for (let j = 1; j < rows.length; j++) {
            const cols = rows[j].split(',');
            const score = cols[0];
            for (let i = 1; i < headers.length; i++) {
                if (cols[i]) {
                    const [lower, upper] = cols[i].split('-').map(Number);
                    tables[headers[i]][score] = [lower, upper];
                }
            }
        }
        PHONEME_TABLES[confidenceLevel] = tables;
    } catch (e) {
        console.error("Failed to load phoneme tables", e);
    }
};

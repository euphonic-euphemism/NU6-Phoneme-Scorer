const fs = require('fs');
const vm = require('vm');

// --- 1. EXTRACT THE SIMULATED_DB FROM THE HTML FILE ---

const extractSimulatedDB = () => {
    const src = fs.readFileSync('nu6_scoring_app.html', 'utf8');
    const startToken = 'const SIMULATED_DB = (() => {';
    const start = src.indexOf(startToken);
    if (start === -1) throw new Error('SIMULATED_DB start token not found');
    const endToken = 'return records;';
    const end = src.indexOf(endToken, start);
    if (end === -1) throw new Error('SIMULATED_DB end token not found');

    // Extract the IIFE block
    const snippet = src.slice(start, src.indexOf('})();', end) + 5);

    // We need the LIST constants for the stats calculator to work
    const listConstantsStart = src.indexOf('const LIST_1A');
    const listConstantsEnd = src.indexOf('const WORD_TABLES');
    const listConstants = src.slice(listConstantsStart, listConstantsEnd);

    // The script needs to be runnable in a sandbox
    const wrapped = `${listConstants}\n${snippet}\nmodule.exports = SIMULATED_DB;`;

    const context = { module: { exports: {} }, console, Date, Math };
    vm.createContext(context);
    try {
        const script = new vm.Script(wrapped, { filename: 'simdb-extract.js' });
        script.runInContext(context);
        return context.module.exports;
    } catch (e) {
        console.error("Error executing snippet:", e);
        return [];
    }
};

// --- 2. ANALYZE THE RECORDS ---

const analyzeDB = (records) => {
    if (!records || records.length === 0) {
        console.log("No records to analyze.");
        return;
    }

    const stats = {
        totalRecords: records.length,
        phonemeParityFailures: 0,
        techComparisons: 0,
        techFailures: 0,
        scoringMode: { word: 0, phoneme: 0 },
        conditions: { Unaided: 0, 'Current Tech': 0, 'New Tech': 0 },
        listUsage: {},
        scoresByCondition: {
            Unaided: { wordScores: [], phonemeScores: [] },
            'Current Tech': { wordScores: [], phonemeScores: [] },
            'New Tech': { wordScores: [], phonemeScores: [] },
        },
        patientRecords: {},
    };

    records.forEach(r => {
        const { A, B } = r.tests;
        
        // --- Integrity Checks ---
        const isAPhoneme = A.scoringMode === 'phoneme';
        const isBPhoneme = B.scoringMode === 'phoneme';
        if ((isAPhoneme || isBPhoneme) && !(isAPhoneme && isBPhoneme)) {
            stats.phonemeParityFailures++;
        }
        
        // --- Distribution Analysis ---
        stats.scoringMode[A.scoringMode]++;
        stats.scoringMode[B.scoringMode]++;
        stats.conditions[A.condition]++;
        stats.conditions[B.condition]++;
        stats.listUsage[A.listId] = (stats.listUsage[A.listId] || 0) + 1;
        stats.listUsage[B.listId] = (stats.listUsage[B.listId] || 0) + 1;

        // --- Score Analysis ---
        [A, B].forEach(test => {
            if (stats.scoresByCondition[test.condition]) {
                if(test.stats.wordPercent != null) stats.scoresByCondition[test.condition].wordScores.push(test.stats.wordPercent);
                if(test.stats.phonemePercent != null) stats.scoresByCondition[test.condition].phonemeScores.push(test.stats.phonemePercent);
            }
        });
        
        // --- Tech vs Unaided Comparison ---
        const checkTechVUnaided = (unaidedTest, techTest) => {
            stats.techComparisons++;
            const unaidedScore = unaidedTest.stats.wordPercent;
            const techScore = techTest.stats.wordPercent;
            if (unaidedScore != null && techScore != null && (techScore + 2) < unaidedScore) {
                stats.techFailures++;
            }
        };

        if (A.condition === 'Unaided' && (B.condition === 'Current Tech' || B.condition === 'New Tech')) {
            checkTechVUnaided(A, B);
        }
        if (B.condition === 'Unaided' && (A.condition === 'Current Tech' || A.condition === 'New Tech')) {
            checkTechVUnaided(B, A);
        }

        // --- Longitudinal Data ---
        stats.patientRecords[r.cNumber] = (stats.patientRecords[r.cNumber] || 0) + 1;
    });

    return stats;
};

// --- 3. PRINT THE RESULTS ---

const printResults = (stats) => {
    if (!stats) return;

    const avg = (arr) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    
    console.log("--- Simulated Database Analysis ---");
    console.log(`Total Records: ${stats.totalRecords}`);
    
    console.log("\n--- Integrity Checks ---");
    console.log(`Phoneme Parity Failures: ${stats.phonemeParityFailures}`);
    const techSuccessRate = stats.techComparisons > 0 ? (1 - stats.techFailures / stats.techComparisons) : 1;
    console.log(`Tech >= Unaided Success Rate: ${(techSuccessRate * 100).toFixed(1)}% (${stats.techFailures} failures out of ${stats.techComparisons} comparisons)`);

    console.log("\n--- Data Distribution ---");
    console.log("Scoring Modes (per test):", stats.scoringMode);
    console.log("Conditions (per test):", stats.conditions);
    console.log("List Usage (per test):", stats.listUsage);

    console.log("\n--- Average Scores by Condition ---");
    for (const cond in stats.scoresByCondition) {
        const wordAvg = avg(stats.scoresByCondition[cond].wordScores);
        const phonemeAvg = avg(stats.scoresByCondition[cond].phonemeScores);
        console.log(`  ${cond}:`);
        console.log(`    Avg. Word Score: ${wordAvg.toFixed(1)}%`);
        console.log(`    Avg. Phoneme Score: ${phonemeAvg.toFixed(1)}%`);
    }

    console.log("\n--- Longitudinal Data ---");
    const patientCounts = Object.values(stats.patientRecords);
    const singleRecordPatients = patientCounts.filter(c => c === 1).length;
    const longitudinalPatients = patientCounts.length - singleRecordPatients;
    console.log(`Total Unique Patients: ${patientCounts.length}`);
    console.log(`Patients with >1 Record: ${longitudinalPatients}`);
    console.log("---------------------------------");
};

// --- RUN SCRIPT ---

try {
    const records = extractSimulatedDB();
    const analysis = analyzeDB(records);
    printResults(analysis);
    process.exit(0);
} catch (e) {
    console.error("Script failed:", e.message);
    process.exit(1);
}

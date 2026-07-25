import { calculateStats, getListData, getCriticalLimits, getInterpolatedCriticalLimits } from "../../utils/scoring.js";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Loader } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
export const HistoryChart = ({ cNumber }) => {
            const canvasNu6Ref = useRef(null);
            const canvasBkbRef = useRef(null);
            const chartNu6Ref = useRef(null);
            const chartBkbRef = useRef(null);
            const [historyData, setHistoryData] = useState([]);
            const [loading, setLoading] = useState(false);

            useEffect(() => {
                if (!cNumber) return;
                setLoading(true);
                window.SecureDB.getPatientHistory(cNumber).then(data => {
                    // Sort ascending (oldest first) for correct chronological charting
                    const sortedData = [...data].sort((a, b) => new Date(a.testDate) - new Date(b.testDate));
                    setHistoryData(sortedData);
                    setLoading(false);
                });
            }, [cNumber]);

            useEffect(() => {
                if (historyData.length === 0) return;

                const nu6Data = { labels: [], datasets: {} };
                const bkbData = { labels: [], datasets: {} };
                let hasNu6 = false;
                let hasBkb = false;

                const labels = historyData.map(r => r.testDate);

                historyData.forEach((record, idx) => {
                    const processTest = (test) => {
                        if (!test || !test.listId) return;
                        const stats = calculateStats(test.listId, test.section, test.scores, test.limitTo10);
                        if (!stats) return;

                        let chartLabel = test.condition || 'Unknown';
                        
                        let borderColor = '#94a3b8'; 
                        let borderDash = [];
                        let pointStyle = 'circle';
                        
                        const lowerCond = chartLabel.toLowerCase();
                        if (lowerCond.includes('unaided')) {
                            chartLabel = 'Unaided';
                            borderColor = '#ef4444'; // red
                        } else if (lowerCond.includes('new') || lowerCond.includes('current') || lowerCond.includes('aid')) {
                            chartLabel = 'Aided';
                            borderColor = '#3b82f6'; // blue
                            pointStyle = 'rect';
                        }

                        if (stats.isBKB) {
                            if (stats.snr50 !== undefined) {
                                hasBkb = true;
                                if (!bkbData.datasets[chartLabel]) {
                                    bkbData.datasets[chartLabel] = {
                                        label: chartLabel,
                                        data: Array(historyData.length).fill(null),
                                        borderColor,
                                        borderDash,
                                        pointStyle,
                                        pointRadius: 5,
                                        tension: 0.2,
                                        spanGaps: true
                                    };
                                }
                                bkbData.datasets[chartLabel].data[idx] = stats.snr50;
                            }
                        } else {
                            if (stats.wordPercent !== undefined) {
                                hasNu6 = true;
                                if (!nu6Data.datasets[chartLabel]) {
                                    nu6Data.datasets[chartLabel] = {
                                        label: chartLabel,
                                        data: Array(historyData.length).fill(null),
                                        borderColor,
                                        borderDash,
                                        pointStyle,
                                        pointRadius: 5,
                                        tension: 0.2,
                                        spanGaps: true
                                    };
                                }
                                nu6Data.datasets[chartLabel].data[idx] = stats.wordPercent;
                            }
                        }
                    };

                    processTest(record.tests?.A);
                    processTest(record.tests?.B);
                });

                if (hasNu6 && canvasNu6Ref.current) {
                    if (chartNu6Ref.current) chartNu6Ref.current.destroy();
                    chartNu6Ref.current = new Chart(canvasNu6Ref.current, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: Object.values(nu6Data.datasets)
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: { display: true, text: 'NU-6 Word Recognition Score (%)' },
                                tooltip: {
                                    callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y}%` }
                                }
                            },
                            scales: {
                                y: { min: 0, max: 100, title: { display: true, text: 'Score (%)' } },
                                x: { title: { display: true, text: 'Test Date' } }
                            }
                        }
                    });
                } else if (chartNu6Ref.current) {
                    chartNu6Ref.current.destroy();
                }

                if (hasBkb && canvasBkbRef.current) {
                    if (chartBkbRef.current) chartBkbRef.current.destroy();
                    chartBkbRef.current = new Chart(canvasBkbRef.current, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: Object.values(bkbData.datasets)
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                title: { display: true, text: 'BKB-SIN SNR-50 (dB)' },
                                tooltip: {
                                    callbacks: { label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y} dB SNR` }
                                }
                            },
                            scales: {
                                y: { 
                                    reverse: true, // Lower is better
                                    title: { display: true, text: 'SNR-50 (dB)' } 
                                },
                                x: { title: { display: true, text: 'Test Date' } }
                            }
                        }
                    });
                } else if (chartBkbRef.current) {
                    chartBkbRef.current.destroy();
                }

                return () => {
                    if (chartNu6Ref.current) chartNu6Ref.current.destroy();
                    if (chartBkbRef.current) chartBkbRef.current.destroy();
                };
            }, [historyData]);

            if (!cNumber) return <div className="text-center text-slate-400 py-10">Enter Patient ID to view history.</div>;
            if (loading) return <div className="text-center text-slate-500 py-10"><Loader className="w-8 h-8 mx-auto mb-2 text-blue-600" />Loading history...</div>;
            if (historyData.length === 0) return <div className="text-center text-slate-400 py-10">No history found for ID: {cNumber}</div>;

            const hasNu6 = historyData.some(r => {
                const a = calculateStats(r.tests?.A?.listId, r.tests?.A?.section, r.tests?.A?.scores, r.tests?.A?.limitTo10);
                const b = calculateStats(r.tests?.B?.listId, r.tests?.B?.section, r.tests?.B?.scores, r.tests?.B?.limitTo10);
                return (a && !a.isBKB) || (b && !b.isBKB);
            });

            const hasBkb = historyData.some(r => {
                const a = calculateStats(r.tests?.A?.listId, r.tests?.A?.section, r.tests?.A?.scores, r.tests?.A?.limitTo10);
                const b = calculateStats(r.tests?.B?.listId, r.tests?.B?.section, r.tests?.B?.scores, r.tests?.B?.limitTo10);
                return (a && a.isBKB) || (b && b.isBKB);
            });

            return (
                <div className="space-y-6">
                    {/* Longitudinal Charts */}
                    {(hasNu6 || hasBkb) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {hasNu6 && (
                                <div className="bg-white rounded-lg border border-slate-200 p-4 h-64">
                                    <canvas ref={canvasNu6Ref}></canvas>
                                </div>
                            )}
                            {hasBkb && (
                                <div className="bg-white rounded-lg border border-slate-200 p-4 h-64">
                                    <canvas ref={canvasBkbRef}></canvas>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Test A</th>
                                    <th className="px-4 py-2">Word / SNR</th>
                                    <th className="px-4 py-2 text-blue-400">Phon</th>
                                    <th className="px-4 py-2">Test B</th>
                                    <th className="px-4 py-2">Word / SNR</th>
                                    <th className="px-4 py-2 text-purple-400">Phon</th>
                                    <th className="px-4 py-2 border-l border-slate-100">Diff / Sig</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {[...historyData].reverse().map((record, idx) => {
                                    const statsA = calculateStats(record.tests.A.listId, record.tests.A.section, record.tests.A.scores, record.tests.A.limitTo10);
                                    const statsB = calculateStats(record.tests.B.listId, record.tests.B.section, record.tests.B.scores, record.tests.B.limitTo10);

                                    // Significance Calculation
                                    let sigDisplay = <span className="text-slate-300">--</span>;

                                    if (statsA.isBKB && statsB.isBKB) {
                                        if (statsA.snr50 !== undefined && statsB.snr50 !== undefined) {
                                            const diff = statsB.snr50 - statsA.snr50;
                                            const critDiff = 1.9;
                                            const isSig = Math.abs(diff) > critDiff;
                                            const color = isSig ? 'text-emerald-600 font-bold' : 'text-slate-400';
                                            sigDisplay = (
                                                <div className={color}>
                                                    {diff > 0 ? '+' : ''}{diff.toFixed(1)} dB
                                                    {isSig && <span className="ml-1 text-xs bg-emerald-100 text-emerald-800 px-1 rounded">Sig</span>}
                                                </div>
                                            );
                                        }
                                    } else if (!statsA.isBKB && !statsB.isBKB) {
                                        const n = record.tests.A.limitTo10 ? 10 : (record.tests.A.section === 'full' ? 50 : 25);
                                        const conf = record.confidenceLevel || 80;
                                        const limits = getCriticalLimits(statsA.wordPercent, n, conf, false);
                                        const isSigWord = statsB.wordPercent < limits.lower || statsB.wordPercent > limits.upper;
                                        const wDiff = statsB.wordPercent - statsA.wordPercent;

                                        let isSigPhon = false;
                                        let pDiff = 0;
                                        if (record.tests.A.scoringMode === 'phoneme') {
                                            const nPhon = n * 3;
                                            const limitsPhon = getInterpolatedCriticalLimits(statsA.phonemePercent, nPhon, conf);
                                            isSigPhon = statsB.phonemePercent < limitsPhon.lower || statsB.phonemePercent > limitsPhon.upper;
                                            pDiff = statsB.phonemePercent - statsA.phonemePercent;
                                        }

                                        sigDisplay = (
                                            <div className="flex flex-col text-xs space-y-0.5">
                                                <div className={isSigWord ? "text-emerald-600 font-bold" : "text-slate-400"}>
                                                    W: {wDiff > 0 ? '+' : ''}{wDiff}%
                                                    {isSigWord && " (Sig)"}
                                                </div>
                                                {record.tests.A.scoringMode === 'phoneme' && (
                                                    <div className={isSigPhon ? "text-purple-600 font-bold" : "text-slate-300"}>
                                                        P: {pDiff > 0 ? '+' : ''}{pDiff}%
                                                        {isSigPhon && "*"}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }

                                    return (
                                        <tr key={record.id || idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-2">{record.testDate}</td>

                                            {/* Test A */}
                                            <td className="px-4 py-2 text-slate-600">{record.tests.A.condition}</td>
                                            {statsA.isBKB ? (
                                                <td colSpan={2} className="px-4 py-2 font-bold text-blue-700 bg-blue-50/30">
                                                    SNR-50: {statsA.snr50?.toFixed(1)} dB
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-2 font-bold text-blue-600">{statsA.wordPercent}%</td>
                                                    <td className="px-4 py-2 font-medium text-blue-400">{statsA.phonemePercent}%</td>
                                                </>
                                            )}

                                            {/* Test B */}
                                            <td className="px-4 py-2 text-slate-600 border-l border-slate-100">{record.tests.B.condition}</td>
                                            {statsB.isBKB ? (
                                                <td colSpan={2} className="px-4 py-2 font-bold text-purple-700 bg-purple-50/30">
                                                    SNR-50: {statsB.snr50?.toFixed(1)} dB
                                                </td>
                                            ) : (
                                                <>
                                                    <td className="px-4 py-2 font-bold text-purple-600">{statsB.wordPercent}%</td>
                                                    <td className="px-4 py-2 font-medium text-purple-400">{statsB.phonemePercent}%</td>
                                                </>
                                            )}

                                            {/* Diff / Sig */}
                                            <td className="px-4 py-2 border-l border-slate-100">
                                                {sigDisplay}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        };

        
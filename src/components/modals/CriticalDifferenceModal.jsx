import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
import { getCriticalLimits, generateData } from '../../utils/scoring.js';
export const CriticalDifferenceModal = ({ isOpen, onClose, confidenceLevel }) => {
            const chartRef = useRef(null);
            const canvasRef = useRef(null);
            const [viewMode, setViewMode] = useState('words'); // 'words' or 'phonemes'
            const [selectedN, setSelectedN] = useState('50'); // '10','25','50' for words; '30','75','150' for phonemes
            const [tableData, setTableData] = useState([]);
            const [isTableView, setIsTableView] = useState(true); // Default to Table View

            useEffect(() => {
                if (viewMode === 'words') {
                    // Ensure valid N for words
                    if (['10', '25', '50'].indexOf(selectedN) === -1) setSelectedN('50');
                } else {
                    if (['30', '75', '150'].indexOf(selectedN) === -1) setSelectedN('150');
                }
            }, [viewMode]);

            useEffect(() => {
                const n = parseInt(selectedN);
                const isPhoneme = viewMode === 'phonemes';
                const data = [];

                // Always generate discrete integer steps for the table view
                // This ensures we match the specific count/score alignment of the test
                for (let i = 0; i <= n; i++) {
                    const score = (i / n) * 100;
                    const limits = getCriticalLimits(score, n, confidenceLevel, isPhoneme);
                    data.push({
                        count: i,
                        score: score,
                        lower: limits.lower,
                        upper: limits.upper
                    });
                }
                setTableData(data);

                // If chart view is active, update chart
                if (!isTableView && canvasRef.current) {
                    if (chartRef.current) { chartRef.current.destroy(); }

                    const ctx = canvasRef.current.getContext('2d');

                    // Regenerate ALL datasets for the chart context
                    const data10 = generateData(10, confidenceLevel, false);
                    const data25 = generateData(25, confidenceLevel, false);
                    const data30 = generateData(30, confidenceLevel, true);
                    const data50 = generateData(50, confidenceLevel, false);
                    const data75 = generateData(75, confidenceLevel, true);
                    const data150 = generateData(150, confidenceLevel, true);

                    chartRef.current = new Chart(ctx, {
                        type: 'line',
                        data: {
                            datasets: [
                                { label: 'N = 10 (Words)', data: data10, borderColor: '#9467bd', borderDash: [5, 5], borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 },
                                { label: 'N = 25 (Words)', data: data25, borderColor: '#d62728', borderDash: [5, 5], borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 },
                                { label: 'N = 50 (Words)', data: data50, borderColor: '#ff7f0e', borderDash: [5, 5], borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 },
                                { label: 'N = 30 (Phonemes)', data: data30, borderColor: '#17becf', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 },
                                { label: 'N = 75 (Phonemes)', data: data75, borderColor: '#2ca02c', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 },
                                { label: 'N = 150 (Phonemes)', data: data150, borderColor: '#1f77b4', borderWidth: 2, pointRadius: 0, fill: false, tension: 0.4 }
                            ]
                        },
                        options: { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false, }, plugins: { title: { display: true, text: `Critical Difference Ranges (${confidenceLevel}% Confidence)` }, tooltip: { callbacks: { label: function (context) { return context.dataset.label + ': ±' + context.parsed.y.toFixed(1) + '%'; } } } }, scales: { x: { type: 'linear', title: { display: true, text: 'Score (%)' }, min: 0, max: 100 }, y: { title: { display: true, text: 'Margin of Error (+/- %)' }, min: 0, suggestedMax: 30 } } }
                    });
                }
            }, [selectedN, confidenceLevel, viewMode, isTableView, isOpen]);

            if (!isOpen) return null;

            return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl p-6 relative flex flex-col max-h-[90vh]">
                        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>

                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Critical Difference Tables ({confidenceLevel}% Confidence)</h3>

                            <div className="flex gap-4 mb-4 border-b border-slate-200 pb-2">
                                <button onClick={() => setViewMode('words')} className={`pb-2 text-sm font-bold transition-colors ${viewMode === 'words' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Whole Word Scoring (Monte Carlo)</button>
                                <button onClick={() => setViewMode('phonemes')} className={`pb-2 text-sm font-bold transition-colors ${viewMode === 'phonemes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Phoneme Scoring (Monte Carlo)</button>
                            </div>

                            <div className="flex gap-2">
                                {viewMode === 'words' ? (
                                    <>
                                        <button onClick={() => setSelectedN('10')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedN === '10' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>N = 10</button>
                                        <button onClick={() => setSelectedN('25')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedN === '25' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>N = 25</button>
                                        <button onClick={() => setSelectedN('50')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedN === '50' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>N = 50</button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={() => setSelectedN('30')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedN === '30' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>N = 30</button>
                                        <button onClick={() => setSelectedN('75')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedN === '75' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>N = 75</button>
                                        <button onClick={() => setSelectedN('150')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${selectedN === '150' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>N = 150</button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded-lg border-slate-200 custom-scrollbar">
                            <table className="w-full text-sm text-left relative">
                                <thead className="bg-slate-50 text-slate-600 font-bold text-xs uppercase sticky top-0 shadow-sm">
                                    <tr>
                                        <th className="px-4 py-3 border-b">Score (Count)</th>
                                        <th className="px-4 py-3 border-b text-center">Score (%)</th>
                                        <th className="px-4 py-3 border-b text-center text-red-600">Lower Limit</th>
                                        <th className="px-4 py-3 border-b text-center text-emerald-600">Upper Limit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tableData.length > 0 ? (
                                        tableData.map((row, idx) => {
                                            const n = parseInt(selectedN);
                                            return (
                                                <tr key={idx} className="hover:bg-blue-50">
                                                    <td className="px-4 py-2 font-mono text-slate-500">{row.count} / {n}</td>
                                                    <td className="px-4 py-2 font-bold text-center text-slate-800">{row.score.toFixed(1)}%</td>
                                                    <td className="px-4 py-2 text-center text-slate-600">{row.lower.toFixed(1)}%</td>
                                                    <td className="px-4 py-2 text-center text-slate-600">{row.upper.toFixed(1)}%</td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr><td colSpan="4" className="text-center py-4 text-slate-500">Loading data...</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 text-center">
                            <button onClick={onClose} className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            );
        };

        
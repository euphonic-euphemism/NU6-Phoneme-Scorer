import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Download } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
export const ComparativeEaseScaleModal = ({ isOpen, onClose }) => {
            if (!isOpen) return null;
            const captureRef = useRef(null);

            const handleDownload = async () => {
                if (!captureRef.current) return;
                try {
                    const canvas = await html2canvas(captureRef.current, { scale: 2, backgroundColor: '#ffffff' });
                    const link = document.createElement('a');
                    link.download = 'Comparative_Listening_Scale.png';
                    link.href = canvas.toDataURL();
                    link.click();
                } catch (err) {
                    console.error(err);
                    alert("Export failed");
                }
            };

            const scaleData = [
                { val: 10, label: "Much Easier", desc: "Significant improvement. Listening requires almost no effort compared to before.", color: "bg-emerald-100 border-emerald-300", textColor: "text-emerald-800" },
                { val: 9, label: "Very Easy", desc: "A major improvement in clarity and comfort.", color: "bg-emerald-50 border-emerald-200", textColor: "text-emerald-700" },
                { val: 8, label: "Easier", desc: "Noticeably better. Listening is clearly less straining.", color: "bg-green-50 border-green-200", textColor: "text-green-700" },
                { val: 7, label: "Moderately Easier", desc: "Definite improvement, though some effort remains.", color: "bg-lime-50 border-lime-200", textColor: "text-lime-700" },
                { val: 6, label: "Slightly Easier", desc: "A small but noticeable improvement.", color: "bg-yellow-50 border-yellow-200", textColor: "text-yellow-700" },
                { val: 5, label: "No Difference", desc: "Listening effort is exactly the same as the previous condition.", color: "bg-slate-100 border-slate-300", textColor: "text-slate-800" },
                { val: 4, label: "Slightly Harder", desc: "A small increase in difficulty or strain.", color: "bg-orange-50 border-orange-200", textColor: "text-orange-700" },
                { val: 3, label: "Moderately Harder", desc: "Noticeably more difficult to follow speech.", color: "bg-orange-100 border-orange-300", textColor: "text-orange-800" },
                { val: 2, label: "Harder", desc: "Increased strain. Listening is clearly more fatiguing.", color: "bg-red-50 border-red-200", textColor: "text-red-700" },
                { val: 1, label: "Very Hard", desc: "Much more difficult. Requires intense concentration.", color: "bg-red-100 border-red-300", textColor: "text-red-800" },
                { val: 0, label: "Much Harder", desc: "Impossible or significantly worse than before.", color: "bg-red-300 border-red-400", textColor: "text-red-900" }
            ];

            return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto">
                        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        <div ref={captureRef} className="p-2">
                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-slate-800">Comparative Listening Scale</h1>
                                <p className="text-slate-500 text-sm mt-1">...compared to the previous condition.</p>
                                <div className="flex justify-center items-center gap-4 mt-4 text-xs font-bold uppercase tracking-widest text-slate-400">
                                    <span>Harder</span>
                                    <div className="w-24 h-0.5 bg-gradient-to-r from-red-400 via-slate-300 to-emerald-400"></div>
                                    <span>Easier</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                {scaleData.map(item => (
                                    <div key={item.val} className={`flex items-center gap-4 p-3 rounded-lg border ${item.color} mb-2`}>
                                        <div className={`flex flex-col items-center justify-center w-12 h-12 bg-white/60 rounded-full font-bold text-xl shadow-sm shrink-0 ${item.textColor}`}>
                                            {item.val}
                                        </div>
                                        <div>
                                            <div className={`font-bold text-base ${item.textColor}`}>{item.label}</div>
                                            <div className="text-xs opacity-80 text-slate-600">{item.desc}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-center gap-3">
                            <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"><Download className="w-4 h-4" /> PNG</button>
                            <button onClick={onClose} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium">Close</button>
                        </div>
                    </div>
                </div>
            );
        };

        // Recovery Modal for crash recovery
        
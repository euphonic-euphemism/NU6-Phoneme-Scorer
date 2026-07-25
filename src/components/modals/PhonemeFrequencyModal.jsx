import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Activity } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
export const PhonemeFrequencyModal = ({ isOpen, onClose }) => {
            if (!isOpen) return null;
            return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative">
                        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> Phoneme Frequency Guide</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left border-collapse">
                                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200"><tr><th className="px-4 py-2 border-r border-slate-200">Class</th><th className="px-4 py-2 border-r border-slate-200">Examples</th><th className="px-4 py-2">Critical Frequency Range</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-medium text-slate-700 border-r border-slate-200">Vowels</td><td className="px-4 py-2 text-slate-600 border-r border-slate-200">/i, u, a/</td><td className="px-4 py-2 text-slate-800"><strong>Low/Mid</strong> (F1: 250-1000 Hz, F2: 800-2500 Hz)</td></tr>
                                    <tr className="hover:bg-slate-50 bg-slate-50/50"><td className="px-4 py-2 font-medium text-slate-700 border-r border-slate-200">Nasals</td><td className="px-4 py-2 text-slate-600 border-r border-slate-200">/m, n, ŋ/</td><td className="px-4 py-2 text-slate-800"><strong>Low</strong> (~250-500 Hz Murmur)</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-medium text-slate-700 border-r border-slate-200">Liquids/Glides</td><td className="px-4 py-2 text-slate-600 border-r border-slate-200">/l, r, w, j/</td><td className="px-4 py-2 text-slate-800"><strong>Low/Mid</strong> (Formant transitions 500-2000 Hz)</td></tr>
                                    <tr className="hover:bg-slate-50 bg-slate-50/50"><td className="px-4 py-2 font-medium text-slate-700 border-r border-slate-200">Stops</td><td className="px-4 py-2 text-slate-600 border-r border-slate-200">/p, t, k, b, d, g/</td><td className="px-4 py-2 text-slate-800"><strong>Mid/High</strong> (Burst energy 1500 - 4000+ Hz)</td></tr>
                                    <tr className="hover:bg-slate-50"><td className="px-4 py-2 font-medium text-slate-700 border-r border-slate-200">Fricatives</td><td className="px-4 py-2 text-slate-600 border-r border-slate-200">/f, s, ʃ, θ/</td><td className="px-4 py-2 text-slate-800"><strong>High</strong> (Turbulence 2500 - 8000+ Hz)</td></tr>
                                    <tr className="hover:bg-slate-50 bg-slate-50/50"><td className="px-4 py-2 font-medium text-slate-700 border-r border-slate-200">Affricates</td><td className="px-4 py-2 text-slate-600 border-r border-slate-200">/tʃ, dʒ/</td><td className="px-4 py-2 text-slate-800"><strong>Mid/High</strong> (Wide range 2000 - 8000 Hz)</td></tr>
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-center"><button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">Close</button></div>
                    </div>
                </div>
            );
        };

        
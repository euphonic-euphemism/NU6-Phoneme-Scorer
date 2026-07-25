import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, FileText } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
export const RecoveryModal = ({ isOpen, data, onRestore, onDiscard }) => {
            if (!isOpen || !data) return null;
            const timestamp = new Date(data.timestamp);
            const timeAgo = ((Date.now() - timestamp.getTime()) / 60000).toFixed(0); // minutes ago

            return (
                <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                        <div className="flex items-start gap-3 mb-4">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">Recover Unsaved Work?</h2>
                                <p className="text-sm text-slate-500 mt-1">We found unsaved data from {timeAgo} minute{timeAgo !== '1' ? 's' : ''} ago.</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-lg p-4 mb-4 border border-slate-200">
                            <div className="text-sm space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Patient:</span>
                                    <span className="font-medium text-slate-800">{data.patientName || '(empty)'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">ID:</span>
                                    <span className="font-medium text-slate-800">{data.cNumber || '(empty)'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Date:</span>
                                    <span className="font-medium text-slate-800">{data.testDate}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Time saved:</span>
                                    <span className="font-medium text-slate-800">{timestamp.toLocaleTimeString()}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={onRestore} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                                <RotateCcw className="w-4 h-4" /> Restore
                            </button>
                            <button onClick={onDiscard} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-lg font-medium transition-colors">
                                Discard
                            </button>
                        </div>
                    </div>
                </div>
            );
        };

        const computeAgeYears = (dobStr, refDateStr) => {
            if (!dobStr || !refDateStr) return null;
            const dob = new Date(dobStr);
            const ref = new Date(refDateStr);
            if (Number.isNaN(dob.getTime()) || Number.isNaN(ref.getTime())) return null;
            let age = ref.getFullYear() - dob.getFullYear();
            const m = ref.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && ref.getDate() < dob.getDate())) age--;
            return age >= 0 ? age : null;
        };

        
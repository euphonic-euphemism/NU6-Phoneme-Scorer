import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
export const ImportPreviewModal = ({ isOpen, onClose, fileName, records, invalidCount, onImportOverwrite, onImportAppend, onImportSkip, onImportMerge, onImportUseSelected, defaultMode }) => {
            if (!isOpen) return null;
            const sample = (records || []).slice(0, 5);
            const modeLabels = { append: 'Append', skip: 'Skip duplicates', overwrite: 'Overwrite', merge: 'Merge duplicates' };
            const selectedLabel = modeLabels[defaultMode] || 'Append';
            return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative max-h-[80vh] overflow-y-auto">
                        <button onClick={() => { onClose(); if (fileInputRef && fileInputRef.current) fileInputRef.current.value = ''; }} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">Import Preview</h3>
                        <div className="text-sm text-slate-500 mb-4">File: <span className="font-mono">{fileName}</span></div>
                        <div className="mb-4">
                            <div className="text-sm">Total records: <span className="font-bold">{records?.length || 0}</span></div>
                            <div className="text-sm">Invalid records detected: <span className="font-bold">{invalidCount}</span></div>
                        </div>

                        <div className="mb-3 text-xs text-slate-500">Import options: <span className="font-medium">Append</span> (import as new records), <span className="font-medium">Skip duplicates</span> (ignore records with same ID), <span className="font-medium">Overwrite</span> (replace existing records by ID), or <span className="font-medium">Merge duplicates</span> (combine matching IDs or patient/date records). The <span className="font-medium">selected</span> mode before opening this modal is shown below.</div>

                        <div className="mb-4">
                            <div className="text-sm font-bold text-slate-600 mb-1">Selected mode</div>
                            <div className="text-sm text-slate-700 mb-2">{selectedLabel}</div>
                        </div>

                        <div className="space-y-2 mb-4">
                            <div className="text-sm font-bold text-slate-600 mb-2">Sample entries</div>
                            {(sample.length === 0) ? <div className="text-sm text-slate-500 italic">No sample entries available.</div> : sample.map((r, idx) => (
                                <div key={idx} className="p-2 border rounded bg-slate-50">
                                    <div className="font-bold text-slate-800">{r.patientName || '(No name)'} <span className="text-slate-400 font-normal">#{r.cNumber || '—'}</span></div>
                                    <div className="text-xs text-slate-500">{r.testDate || '—'} • {r.tests?.A?.listId || '—'}</div>
                                    <div className="text-xs text-slate-500 mt-1">Notes: {r.notes || '—'}</div>
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                            <button onClick={() => { onImportAppend(); }} className="px-4 py-2 bg-slate-100 rounded text-slate-700 text-sm">Import (Append as New IDs)</button>
                            <button onClick={() => { onImportSkip(); }} className="px-4 py-2 bg-yellow-100 rounded text-yellow-800 text-sm">Import (Skip duplicates)</button>
                            <button onClick={() => { onImportMerge(); }} className="px-4 py-2 bg-emerald-100 rounded text-emerald-800 text-sm">Import (Merge duplicates)</button>
                            <button onClick={() => { onImportOverwrite(); }} className="px-4 py-2 bg-blue-600 rounded text-white text-sm">Import (Overwrite by ID)</button>
                            <button onClick={() => onImportUseSelected()} className="px-4 py-2 bg-green-600 rounded text-white text-sm">Import (Use Selected: {selectedLabel})</button>
                            <button onClick={() => { onClose(); if (fileInputRef && fileInputRef.current) fileInputRef.current.value = ''; }} className="px-4 py-2 bg-white border rounded text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            );
        };

        
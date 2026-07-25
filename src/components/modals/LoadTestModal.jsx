import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Trash2, Search, Loader, Edit } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
export const LoadTestModal = ({ isOpen, onClose, onLoad }) => {
            const [search, setSearch] = useState('');
            const [historyData, setHistoryData] = useState([]);
            const [loading, setLoading] = useState(false);

            useEffect(() => {
                if (isOpen) {
                    setLoading(true);
                    window.SecureDB.getAllTests().then(data => {
                        setHistoryData(data);
                        setLoading(false);
                    });
                }
            }, [isOpen]);

            const handleDelete = async (id, e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this record?")) {
                    try {
                        await window.SecureDB.deleteTest(id);
                        setHistoryData(prev => prev.filter(t => t.id !== id));
                    } catch (err) {
                        alert("Failed to delete record");
                    }
                }
            };

            // Edit handler - same as load but explicit
            const handleEdit = (test, e) => {
                e.stopPropagation();
                onLoad(test);
                onClose();
            };

            const filtered = historyData.filter(t => {
                const s = search.toLowerCase();
                return (t.patientName && t.patientName.toLowerCase().includes(s)) ||
                    (t.cNumber && t.cNumber.toLowerCase().includes(s));
            });

            if (!isOpen) return null;

            return (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl p-6 relative flex flex-col max-h-[80vh]">
                        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-6 h-6" /></button>
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Load Patient History (Secure)</h3>

                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-2.5 text-slate-400 w-5 h-5" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Name or ID..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                            {loading ? <div className="text-center py-8 text-slate-500"><Loader className="w-8 h-8 mx-auto mb-2 text-blue-600" />Loading records...</div> :
                                filtered.length === 0 ? <div className="text-center py-8 text-slate-500 italic">No matching records found in secure database.</div> :
                                    filtered.map(test => (
                                        <div key={test.id} className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-blue-300 transition group flex justify-between items-center">
                                            <div onClick={() => { onLoad(test); onClose(); }} className="flex-1 cursor-pointer">
                                                <div className="font-bold text-slate-800">{test.patientName} <span className="text-slate-400 font-normal">#{test.cNumber}</span></div>
                                                <div className="text-xs text-slate-500">{test.testDate} • {test.tests.A.condition} vs {test.tests.B.condition}</div>
                                            </div>
                                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={(e) => handleEdit(test, e)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition" title="Edit Test"><Edit className="w-4 h-4" /></button>
                                                <button onClick={(e) => handleDelete(test.id, e)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition" title="Delete Test"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    ))}
                        </div>
                    </div>
                </div>
            );
        };

        // ... (Other components) ...


        // Import Preview Modal (top-level)
        
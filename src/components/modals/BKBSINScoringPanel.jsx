import { calculateStats, getListData } from "../../utils/scoring.js";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, Square } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
export const BKBSINScoringPanel = ({ stats, scores, testId, updateScore, playTrack, audioState, onPause, onResume, onStop }) => {
            if (!stats.isBKB) return null;

            const { listA, listB, snr50, totalCorrect, pairId } = stats;

            const renderSentence = (text) => {
                const parts = text.split('*');
                return parts.map((part, index) => {
                    if (index % 2 === 1) {
                        return <span key={index} className="underline decoration-slate-400 decoration-2 font-semibold text-slate-900">{part}</span>;
                    }
                    return <span key={index}>{part}</span>;
                });
            };

            const renderList = (list, label, type) => (
                <div className="flex-1">
                    <h3 className="font-bold text-slate-700 mb-2 border-b pb-1">{label}</h3>
                    <div className="space-y-1">
                        {list.map((item) => {
                            const maxScore = item.kwCount || 3;
                            const currentScore = item.score;
                            // List ID is "BKB1", but we need "BKB1_A_1"
                            // activeTest.listId is "BKB1".
                            // stats.pairId is 1.
                            // We need to use the exact listId string from the state to match calculateStats logic.
                            // calculateStats used: `${listId}_A_${item.i}` where listId passed in is "BKB1"
                            // So we need "BKB1_A_1". 
                            // Prop 'testId' is "A" or "B" (Test A/B), not List ID.
                            // We don't have listId prop here? 
                            // Ah, I need to pass listId or construct it.
                            // Stats object has pairId. I can reconstruct "BKB" + pairId.
                            const listId = `BKB${pairId}`;
                            const scoreKey = `${listId}_${type}_${item.i}`;

                            return (
                                <div key={item.i} className="flex items-start gap-2 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200">
                                    <div className="w-6 font-mono text-xs text-slate-400 pt-1">{item.i}</div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium text-slate-800 mb-1">{renderSentence(item.s)}</div>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-slate-500 font-mono">SNR: {item.snr} dB</div>
                                            <div className="flex gap-1">
                                                {[...Array(maxScore + 1)].map((_, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => updateScore(scoreKey, idx)}
                                                        className={`w-6 h-6 rounded text-xs font-bold transition-colors ${currentScore === idx
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                            }`}
                                                    >
                                                        {idx}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            );

            return (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-2 print:border-black mb-6">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center print:bg-slate-200">
                        <div className="font-bold text-slate-700">BKB-SIN Scoring: List Pair {pairId}</div>
                        <div className="flex gap-4 items-center">
                            <div className="text-sm">
                                <span className="text-slate-500">Total Correct:</span>
                                <span className="font-mono font-bold ml-1 text-slate-800">{totalCorrect}</span>
                            </div>
                            <div className="text-sm bg-blue-50 px-3 py-1 rounded border border-blue-100">
                                <span className="text-blue-600 font-bold">SNR-50:</span>
                                <span className="font-mono font-bold ml-1 text-blue-800">{snr50.toFixed(1)} dB</span>
                            </div>

                            <div className="flex items-center gap-2 print:hidden ml-4 pl-4 border-l border-slate-200">
                                {(audioState === 'stopped' || audioState === undefined) && playTrack && (
                                    <button
                                        onClick={playTrack}
                                        className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium text-xs transition-colors"
                                    >
                                        <Play className="w-3 h-3" /> Play
                                    </button>
                                )}

                                {audioState === 'playing' && (
                                    <button
                                        onClick={onPause}
                                        className="flex items-center gap-1 px-3 py-1 bg-amber-100 text-amber-800 rounded hover:bg-amber-200 font-medium text-xs transition-colors"
                                    >
                                        <Pause className="w-3 h-3" /> Pause
                                    </button>
                                )}

                                {audioState === 'paused' && (
                                    <button
                                        onClick={onResume}
                                        className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium text-xs transition-colors"
                                    >
                                        <Play className="w-3 h-3" /> Resume
                                    </button>
                                )}

                                {(audioState === 'playing' || audioState === 'paused') && (
                                    <button
                                        onClick={onStop}
                                        className="flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 font-medium text-xs transition-colors"
                                    >
                                        <Square className="w-3 h-3" /> Stop
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 flex flex-col md:flex-row gap-6">
                        {renderList(listA, "List A (First Half)", "A")}
                        <div className="hidden md:block w-px bg-slate-200"></div>
                        {renderList(listB, "List B (Second Half)", "B")}
                    </div>
                    <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between print:hidden">
                        <div>SNR starts at +21 dB and decreases by 3 dB per sentence.</div>
                        <div>Score = Key Words Correct</div>
                    </div>
                </div>
            );
        };


        
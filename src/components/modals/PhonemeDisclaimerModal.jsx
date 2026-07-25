import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, AlertCircle } from "../icons/index.jsx";

// Note: You may need to import word lists or other constants if used.
import { LIST_1A, LIST_2A, LIST_3A, LIST_4A, LIST_HF1, LIST_HF2, LIST_HF3, LIST_HF4 } from '../../data/wordLists.js';
export const PhonemeDisclaimerModal = ({ isOpen, onClose }) => {
            if (!isOpen) return null;
            return (<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"> <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-6 relative"> <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"> <X className="w-5 h-5" /> </button> <div className="flex flex-col items-center text-center"> <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600"> <AlertCircle className="w-6 h-6" /> </div> <h3 className="text-lg font-bold text-slate-800 mb-2">Phoneme Scoring Note</h3> <p className="text-sm text-slate-600 mb-6 leading-relaxed"> Phoneme scores are typically about <strong>20% better</strong> than whole word scores. You may want to use a <strong>lower (more difficult) SNR</strong> to avoid ceiling effects. </p> <button onClick={onClose} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium w-full transition-colors"> Got it </button> </div> </div> </div>);
        };

        
        
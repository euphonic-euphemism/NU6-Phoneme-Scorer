import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCheck, Lock, X } from '../icons/index.jsx';

export const LoginModal = ({ onLogin, isSetup }) => {
            const [password, setPassword] = useState('');
            const [confirm, setConfirm] = useState('');
            const [error, setError] = useState('');
            const [resetConfirm, setResetConfirm] = useState(false);

            const handleSubmit = async (e) => {
                e.preventDefault();
                setError('');
                if (isSetup) {
                    const success = await window.SecureDB.login(password);
                    if (success) onLogin();
                    else setError("Incorrect password.");
                } else {
                    if (password !== confirm) { setError("Passwords do not match."); return; }
                    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
                    try {
                        await window.SecureDB.setupPassword(password);
                        onLogin();
                    } catch (err) {
                        setError("Setup failed.");
                    }
                }
            };

            return (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
    initial={{ opacity: 0, scale: 0.9, y: 20 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.9, y: 20 }}
    transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
    className="glass rounded-3xl w-full max-w-md p-8 relative">
                        <div className="flex justify-center mb-6 text-blue-600"><Lock className="w-12 h-12" /></div>
                        <h2 className="text-2xl font-bold text-center text-slate-800 mb-2">{isSetup ? "Unlock Database" : "Set Encryption Password"}</h2>
                        <p className="text-center text-slate-500 mb-6 text-sm">{isSetup ? "Enter your password to access patient records." : "Create a password to encrypt your local database. If you lose this, data cannot be recovered."}</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" autoFocus /></div>
                            {!isSetup && (<div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Confirm Password</label><input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" /></div>)}
                            {error && <div className="text-red-600 text-sm text-center font-medium">{error}</div>}
                            <button type="submit" className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/30 text-white rounded-lg font-bold transition-colors">{isSetup ? "Unlock" : "Set Password & Unlock"}</button>
                            {isSetup && (
                                resetConfirm ? (
                                    <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-200">
                                        <p className="text-xs text-red-600 font-bold text-center mb-2">Are you absolutely sure? This will wipe everything!</p>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => setResetConfirm(false)} className="flex-1 py-2 bg-slate-200 text-slate-700 rounded text-xs font-bold uppercase">Cancel</button>
                                            <button type="button" onClick={async () => await window.SecureDB.resetDatabase()} className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-bold uppercase">Yes, Wipe DB</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button type="button" onClick={() => setResetConfirm(true)} className="w-full mt-2 text-xs text-red-500 hover:text-red-700 font-semibold uppercase">
                                        Forgot Password? Reset Database
                                    </button>
                                )
                            )}
                        </form>
                    </motion.div>
                </div>
            );
        };

        
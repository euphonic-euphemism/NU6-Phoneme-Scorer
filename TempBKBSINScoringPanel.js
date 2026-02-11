
const BKBSINScoringPanel = ({ stats, scores, testId, updateScore, playTrack }) => {
    if (!stats.isBKB) return null;

    const { listA, listB, snr50, totalCorrect, pairId } = stats;

    const renderList = (list, label, type) => (
        <div className="flex-1">
            <h3 className="font-bold text-slate-700 mb-2 border-b pb-1">{label}</h3>
            <div className="space-y-1">
                {list.map((item) => {
                    const maxScore = item.kwCount || 3;
                    const currentScore = item.score;
                    const scoreKey = `BKB${pairId}_${type}_${item.i}`; // activeTest.listId is like 'BKB1'

                    return (
                        <div key={item.i} className="flex items-start gap-2 p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200">
                            <div className="w-6 font-mono text-xs text-slate-400 pt-1">{item.i}</div>
                            <div className="flex-1">
                                <div className="text-sm font-medium text-slate-800 mb-1">{item.s}</div>
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
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
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
                    {playTrack && (
                        <button
                            onClick={playTrack}
                            className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 font-medium text-xs"
                        >
                            <Play className="w-3 h-3" /> Play Track
                        </button>
                    )}
                </div>
            </div>
            <div className="p-4 flex flex-col md:flex-row gap-6">
                {renderList(listA, "List A (First Half)", "A")}
                <div className="hidden md:block w-px bg-slate-200"></div>
                {renderList(listB, "List B (Second Half)", "B")}
            </div>
            <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-xs text-slate-500 flex justify-between">
                <div>SNR starts at +21 dB and decreases by 3 dB per sentence.</div>
                <div>Score = Key Words Correct</div>
            </div>
        </div>
    );
};

import { useState } from 'react'
import { Play, Clock, Trash2, History, ChevronDown } from 'lucide-react'
import SQLEditor from '../components/SQLEditor'
import { useDbStore } from '../store/dbStore'
import { executeQuery } from '../api/client'
import toast from 'react-hot-toast'
import ResultsGrid from '../components/ResultsGrid'

export default function QueryPage() {
    const { selectedDb, queryHistory, addToHistory, clearHistory } = useDbStore()
    const [sql, setSql] = useState('SELECT 1;')
    const [result, setResult] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [duration, setDuration] = useState<number | null>(null)
    const [showHistory, setShowHistory] = useState(false)

    const run = async () => {
        const trimmed = sql.trim()
        if (!trimmed) return
        setLoading(true)
        try {
            const res = await executeQuery(trimmed, selectedDb || undefined)
            setResult(res.data.result)
            setDuration(res.data.duration)
            addToHistory(trimmed)
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Query failed')
            setResult({ error: err.response?.data?.error })
        } finally {
            setLoading(false)
        }
    }

    const rows = result?.rows ?? []
    const cols = rows.length > 0 ? Object.keys(rows[0]) : []

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {selectedDb ? <><span className="text-slate-400">db:</span> {selectedDb}</> : 'No database selected'}
                </span>
                <div className="flex-1" />
                <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out">
                    <History size={13} /> History <ChevronDown size={11} />
                </button>
                <button onClick={run} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-xs rounded-lg font-medium transition-all duration-200 ease-in-out">
                    <Play size={12} /> {loading ? 'Running...' : 'Run'} <kbd className="ml-1 text-[10px] opacity-70 font-mono">Ctrl+↵</kbd>
                </button>
            </div>

            {/* History dropdown */}
            {showHistory && (
                <div className="absolute right-4 top-16 z-50 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-700">
                        <span className="text-xs font-semibold text-slate-500">Query History</span>
                        <button onClick={clearHistory} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"><Trash2 size={11} /> Clear</button>
                    </div>
                    {queryHistory.length === 0 ? <p className="text-xs text-slate-400 p-3">No history yet</p> : queryHistory.map((q, i) => (
                        <button key={i} onClick={() => { setSql(q); setShowHistory(false) }}
                            className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-mono truncate border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors duration-200">
                            {q}
                        </button>
                    ))}
                </div>
            )}

            {/* Editor */}
            <div className="flex-1 p-3 min-h-0" style={{ height: '45%' }}>
                <SQLEditor value={sql} onChange={setSql} onRun={run} />
            </div>

            {/* Results */}
            <div className="border-t border-slate-200 dark:border-slate-800 overflow-auto" style={{ height: '55%' }}>
                {/* Status bar */}
                {(result || duration !== null) && (
                    <div className="flex items-center gap-3 px-4 py-1.5 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                        {result?.error ? (
                            <span className="text-red-500">Error: {result.error}</span>
                        ) : (
                            <>
                                <span className="text-green-600 dark:text-green-400">✓ {rows.length > 0 ? `${rows.length} rows` : `${result?.affectedRows ?? 0} rows affected`}</span>
                                {result?.info && <span>{result.info}</span>}
                                <Clock size={11} /> <span>{duration}ms</span>
                            </>
                        )}
                    </div>
                )}

                {rows.length > 0 ? (
                    <ResultsGrid rows={rows} columns={cols} />
                ) : result && !result.error ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                        Query executed — {result?.affectedRows ?? 0} rows affected
                    </div>
                ) : !result ? (
                    <div className="flex items-center justify-center h-32 text-slate-300 dark:text-slate-600 text-sm">
                        Run a query to see results
                    </div>
                ) : null}
            </div>
        </div>
    )
}

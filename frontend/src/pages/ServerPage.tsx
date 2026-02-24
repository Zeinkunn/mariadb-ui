import { useEffect, useState } from 'react'
import { RefreshCw, Trash2, Square } from 'lucide-react'
import { getServerStatus, getServerVariables, getProcessList, killProcess, setServerVariable } from '../api/client'
import toast from 'react-hot-toast'

export default function ServerPage() {
    const [tab, setTab] = useState<'status' | 'variables' | 'processes'>('status')
    const [status, setStatus] = useState<Record<string, string>>({})
    const [variables, setVariables] = useState<Record<string, string>>({})
    const [processes, setProcesses] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [varSearch, setVarSearch] = useState('')
    const [editVar, setEditVar] = useState<{ name: string; val: string } | null>(null)

    const KEY_METRICS = ['Uptime', 'Queries', 'Threads_connected', 'Slow_queries', 'Bytes_received', 'Bytes_sent', 'Com_select', 'Com_insert', 'Com_update', 'Com_delete']

    const fetch = async () => {
        setLoading(true)
        try {
            if (tab === 'status') { const r = await getServerStatus(); setStatus(r.data) }
            if (tab === 'variables') { const r = await getServerVariables(); setVariables(r.data) }
            if (tab === 'processes') { const r = await getProcessList(); setProcesses(r.data) }
        } catch (err: any) { toast.error(err.response?.data?.error) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetch() }, [tab])

    const handleKill = async (id: number) => {
        if (!confirm(`Kill process ${id}?`)) return
        try { await killProcess(id); toast.success('Process killed'); fetch() }
        catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const handleSetVar = async () => {
        if (!editVar) return
        try { await setServerVariable(editVar.name, editVar.val); toast.success('Variable updated'); setEditVar(null); fetch() }
        catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const fmt = (v: string) => {
        const n = Number(v)
        if (isNaN(n) || v === '') return v
        if (n > 1e9) return (n / 1e9).toFixed(2) + 'B'
        if (n > 1e6) return (n / 1e6).toFixed(2) + 'M'
        if (n > 1e3) return (n / 1e3).toFixed(2) + 'K'
        return v
    }

    const filteredVars = Object.entries(variables).filter(([k]) => k.toLowerCase().includes(varSearch.toLowerCase()))

    return (
        <div className="flex flex-col h-full">
            {/* Tabs */}
            <div className="flex items-center gap-2 px-4 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {(['status', 'variables', 'processes'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 text-xs font-medium capitalize border-b-2 transition-all duration-200 ease-in-out ${tab === t ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        {t === 'processes' ? 'Process List' : t === 'variables' ? 'Variables' : 'Status'}
                    </button>
                ))}
                <div className="flex-1" />
                <button onClick={fetch} className="p-1.5 mb-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out"><RefreshCw size={13} /></button>
            </div>

            <div className="flex-1 overflow-auto">
                {loading ? <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading...</div> : (
                    <>
                        {/* Status */}
                        {tab === 'status' && (
                            <div className="p-4 space-y-4">
                                {/* Key metrics cards */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {KEY_METRICS.slice(0, 8).map(key => status[key] !== undefined && (
                                        <div key={key} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                                            <p className="text-[10px] text-slate-500 mb-1 truncate">{key.replace(/_/g, ' ')}</p>
                                            <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{fmt(status[key])}</p>
                                        </div>
                                    ))}
                                </div>
                                <table className="w-full text-xs border-collapse">
                                    <thead><tr className="bg-slate-100 dark:bg-slate-800"><th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Variable</th><th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Value</th></tr></thead>
                                    <tbody>{Object.entries(status).map(([k, v]) => <tr key={k} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150"><td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{k}</td><td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">{v}</td></tr>)}</tbody>
                                </table>
                            </div>
                        )}

                        {/* Variables */}
                        {tab === 'variables' && (
                            <div className="p-4 space-y-3">
                                <input value={varSearch} onChange={e => setVarSearch(e.target.value)} placeholder="Filter variables..." className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                                {editVar && (
                                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 flex gap-3 items-center">
                                        <span className="text-xs font-mono text-blue-700 dark:text-blue-300">{editVar.name}</span>
                                        <input value={editVar.val} onChange={e => setEditVar({ ...editVar, val: e.target.value })} className="flex-1 px-2 py-1 text-xs rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                                        <button onClick={handleSetVar} className="px-3 py-1 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200">SET</button>
                                        <button onClick={() => setEditVar(null)} className="px-3 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-800 transition-colors duration-200">Cancel</button>
                                    </div>
                                )}
                                <table className="w-full text-xs border-collapse">
                                    <thead><tr className="bg-slate-100 dark:bg-slate-800"><th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Variable</th><th className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Value</th><th className="w-16 border-b border-slate-200 dark:border-slate-700"></th></tr></thead>
                                    <tbody>{filteredVars.map(([k, v]) => (
                                        <tr key={k} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                                            <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{k}</td>
                                            <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400 font-mono">{v}</td>
                                            <td className="px-3 py-1.5"><button onClick={() => setEditVar({ name: k, val: v })} className="text-[10px] px-2 py-0.5 rounded border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200">SET</button></td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}

                        {/* Process list */}
                        {tab === 'processes' && (
                            <div className="p-4">
                                <table className="w-full text-xs border-collapse">
                                    <thead><tr className="bg-slate-100 dark:bg-slate-800">{['ID', 'User', 'Host', 'DB', 'Command', 'Time', 'State', 'Info', ''].map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">{h}</th>)}</tr></thead>
                                    <tbody>{processes.map((p, i) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                                            <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{p.Id}</td>
                                            <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">{p.User}</td>
                                            <td className="px-3 py-1.5 text-slate-500">{p.Host}</td>
                                            <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400">{p.db}</td>
                                            <td className="px-3 py-1.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${p.Command === 'Query' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>{p.Command}</span></td>
                                            <td className="px-3 py-1.5 text-slate-500">{p.Time}s</td>
                                            <td className="px-3 py-1.5 text-slate-500 max-w-32 truncate">{p.State}</td>
                                            <td className="px-3 py-1.5 font-mono text-slate-500 max-w-48 truncate">{p.Info}</td>
                                            <td className="px-3 py-1.5"><button onClick={() => handleKill(p.Id)} className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded border border-red-300 dark:border-red-700 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors duration-200"><Square size={9} /> KILL</button></td>
                                        </tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}

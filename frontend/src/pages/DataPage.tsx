import { useEffect, useState, useCallback } from 'react'
import { Plus, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight, Save } from 'lucide-react'
import { useDbStore } from '../store/dbStore'
import { getTableData, insertRow, updateRow, deleteRow } from '../api/client'
import toast from 'react-hot-toast'

export default function DataPage() {
    const { selectedDb, selectedTable } = useDbStore()
    const [rows, setRows] = useState<any[]>([])
    const [columns, setColumns] = useState<string[]>([])
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(100)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [searchCol, setSearchCol] = useState('')
    const [sortCol, setSortCol] = useState('')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
    const [editingCell, setEditingCell] = useState<{ row: number; col: string } | null>(null)
    const [editVal, setEditVal] = useState('')
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
    const [newRow, setNewRow] = useState<Record<string, string> | null>(null)

    const fetch = useCallback(async () => {
        if (!selectedDb || !selectedTable) return
        setLoading(true)
        try {
            const res = await getTableData(selectedDb, selectedTable, {
                page, limit,
                ...(search && searchCol ? { search, column: searchCol } : {}),
                ...(sortCol ? { sort: sortCol, order: sortOrder } : {}),
            })
            setRows(res.data.rows)
            setColumns(res.data.columns)
            setTotal(res.data.total)
            if (!searchCol && res.data.columns.length) setSearchCol(res.data.columns[0])
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Failed to load data')
        } finally { setLoading(false) }
    }, [selectedDb, selectedTable, page, limit, search, searchCol, sortCol, sortOrder])

    useEffect(() => { setPage(1) }, [selectedDb, selectedTable])
    useEffect(() => { fetch() }, [fetch])

    const totalPages = Math.ceil(total / limit)

    const startEdit = (rowIdx: number, col: string, val: any) => {
        setEditingCell({ row: rowIdx, col })
        setEditVal(val === null ? '' : String(val))
    }

    const commitEdit = async (rowIdx: number, col: string) => {
        setEditingCell(null)
        const row = rows[rowIdx]
        const oldVal = row[col]
        if (String(oldVal ?? '') === editVal) return
        try {
            await updateRow(selectedDb!, selectedTable!, row, { [col]: editVal || null })
            toast.success('Row updated')
            fetch()
        } catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const handleDelete = async () => {
        if (!selectedRows.size) return
        if (!confirm(`Delete ${selectedRows.size} row(s)?`)) return
        for (const idx of selectedRows) {
            try {
                await deleteRow(selectedDb!, selectedTable!, rows[idx])
            } catch (err: any) { toast.error(err.response?.data?.error) }
        }
        setSelectedRows(new Set())
        fetch()
        toast.success(`${selectedRows.size} row(s) deleted`)
    }

    const handleInsert = async () => {
        if (!newRow) return
        try {
            await insertRow(selectedDb!, selectedTable!, newRow)
            toast.success('Row inserted')
            setNewRow(null)
            fetch()
        } catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const toggleSort = (col: string) => {
        if (sortCol === col) setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
        else { setSortCol(col); setSortOrder('asc') }
    }

    if (!selectedDb || !selectedTable) {
        return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Select a table from the sidebar</div>
    }

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{selectedDb}.{selectedTable}</span>
                <div className="flex items-center gap-1 ml-2 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <select value={searchCol} onChange={e => setSearchCol(e.target.value)} className="text-xs px-2 py-1.5 bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none">
                        {columns.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <div className="relative">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-6 pr-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none w-36" />
                    </div>
                </div>
                <div className="flex-1" />
                <select value={limit} onChange={e => { setLimit(+e.target.value); setPage(1) }} className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none transition-all duration-200 ease-in-out">
                    {[25, 100, 500, 1000].map(n => <option key={n} value={n}>{n} rows</option>)}
                </select>
                <button onClick={() => setNewRow(Object.fromEntries(columns.map(c => [c, ''])))} className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 ease-in-out"><Plus size={12} /> Add Row</button>
                {selectedRows.size > 0 && <button onClick={handleDelete} className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 ease-in-out"><Trash2 size={12} /> Delete ({selectedRows.size})</button>}
                <button onClick={fetch} className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out"><RefreshCw size={13} /></button>
            </div>

            {/* New row form */}
            {newRow && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 flex gap-2 flex-wrap items-center">
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-300">New row:</span>
                    {columns.map(col => (
                        <div key={col} className="flex flex-col gap-0.5">
                            <span className="text-[10px] text-blue-600 dark:text-blue-400">{col}</span>
                            <input value={newRow[col] || ''} onChange={e => setNewRow({ ...newRow, [col]: e.target.value })}
                                className="px-2 py-1 text-xs rounded border border-blue-200 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 w-28" />
                        </div>
                    ))}
                    <button onClick={handleInsert} className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white self-end transition-all duration-200 ease-in-out"><Save size={11} /> Insert</button>
                    <button onClick={() => setNewRow(null)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 hover:bg-white dark:hover:bg-slate-800 self-end transition-all duration-200 ease-in-out">Cancel</button>
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading...</div>
                ) : (
                    <table className="w-full text-xs border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-100 dark:bg-slate-800">
                                <th className="w-8 px-3 py-2 text-left border-b border-slate-200 dark:border-slate-700">
                                    <input type="checkbox" checked={selectedRows.size === rows.length && rows.length > 0}
                                        onChange={e => setSelectedRows(e.target.checked ? new Set(rows.map((_, i) => i)) : new Set())}
                                        className="rounded" />
                                </th>
                                {columns.map(col => (
                                    <th key={col} onClick={() => toggleSort(col)} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap transition-colors duration-200">
                                        {col} {sortCol === col ? (sortOrder === 'asc' ? '↑' : '↓') : ''}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row, ri) => (
                                <tr key={ri} className={`border-b border-slate-100 dark:border-slate-800 ${selectedRows.has(ri) ? 'bg-blue-50 dark:bg-blue-950' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'} transition-colors duration-150`}>
                                    <td className="px-3 py-1.5">
                                        <input type="checkbox" checked={selectedRows.has(ri)}
                                            onChange={e => {
                                                const next = new Set(selectedRows)
                                                e.target.checked ? next.add(ri) : next.delete(ri)
                                                setSelectedRows(next)
                                            }} className="rounded" />
                                    </td>
                                    {columns.map(col => (
                                        <td key={col} onDoubleClick={() => startEdit(ri, col, row[col])}
                                            className="px-3 py-1.5 text-slate-700 dark:text-slate-300 max-w-48 cursor-text">
                                            {editingCell?.row === ri && editingCell?.col === col ? (
                                                <input autoFocus value={editVal} onChange={e => setEditVal(e.target.value)}
                                                    onBlur={() => commitEdit(ri, col)}
                                                    onKeyDown={e => { if (e.key === 'Enter') commitEdit(ri, col); if (e.key === 'Escape') setEditingCell(null) }}
                                                    className="w-full px-1 py-0.5 rounded border border-blue-400 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" />
                                            ) : (
                                                <span className={`block truncate ${row[col] === null ? 'text-slate-400 italic' : ''}`}>
                                                    {row[col] === null ? 'NULL' : String(row[col])}
                                                </span>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-xs text-slate-500">{total.toLocaleString()} rows total</span>
                <div className="flex items-center gap-1">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out">
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-slate-600 dark:text-slate-400 px-2">Page {page} of {totalPages || 1}</span>
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out">
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    )
}

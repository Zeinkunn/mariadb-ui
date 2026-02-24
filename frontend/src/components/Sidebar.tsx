import { useEffect, useState, useRef } from 'react'
import {
    Database, Table2, ChevronRight, ChevronDown,
    Plus, Trash2, RefreshCw, Search, Eye, Code2
} from 'lucide-react'
import { useDbStore } from '../store/dbStore'
import { getDatabases, getTables, dropDatabase, dropTable } from '../api/client'
import toast from 'react-hot-toast'
import CreateDbModal from '../pages/modals/CreateDbModal'
import CreateTableModal from '../pages/modals/CreateTableModal'

interface TableInfo {
    name: string; type: string; rows: number
}

export default function Sidebar() {
    const { selectedDb, selectedTable, sidebarOpen, setSelectedDb, setSelectedTable, setActiveTab } = useDbStore()
    const [databases, setDatabases] = useState<string[]>([])
    const [tables, setTables] = useState<Record<string, TableInfo[]>>({})
    const [expanded, setExpanded] = useState<Record<string, boolean>>({})
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [showCreateDb, setShowCreateDb] = useState(false)
    const [showCreateTable, setShowCreateTable] = useState(false)
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; type: 'db' | 'table'; name: string; db?: string } | null>(null)

    const fetchDatabases = async () => {
        setLoading(true)
        try {
            const res = await getDatabases()
            setDatabases(res.data)
        } catch { toast.error('Failed to load databases') }
        finally { setLoading(false) }
    }

    useEffect(() => { fetchDatabases() }, [])

    const fetchTables = async (db: string) => {
        try {
            const res = await getTables(db)
            setTables(prev => ({ ...prev, [db]: res.data }))
        } catch { toast.error(`Failed to load tables for ${db}`) }
    }

    const toggleDb = (db: string) => {
        const next = !expanded[db]
        setExpanded(prev => ({ ...prev, [db]: next }))
        if (next && !tables[db]) fetchTables(db)
        setSelectedDb(db)
    }

    const handleContextMenu = (e: React.MouseEvent, type: 'db' | 'table', name: string, db?: string) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, type, name, db })
    }

    const handleDropDb = async (name: string) => {
        if (!confirm(`Drop database "${name}"? This cannot be undone.`)) return
        try {
            await dropDatabase(name)
            toast.success(`Database ${name} dropped`)
            fetchDatabases()
            if (selectedDb === name) setSelectedDb(null)
        } catch (err: any) { toast.error(err.response?.data?.error) }
        setContextMenu(null)
    }

    const handleDropTable = async (db: string, tbl: string) => {
        if (!confirm(`Drop table "${tbl}"? This cannot be undone.`)) return
        try {
            await dropTable(db, tbl)
            toast.success(`Table ${tbl} dropped`)
            fetchTables(db)
        } catch (err: any) { toast.error(err.response?.data?.error) }
        setContextMenu(null)
    }

    const filteredDbs = databases.filter(db => db.toLowerCase().includes(search.toLowerCase()))

    if (!sidebarOpen) return null

    return (
        <>
            <aside className="w-60 shrink-0 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-200 ease-in-out">
                {/* Header */}
                <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Databases</span>
                    <div className="flex items-center gap-1">
                        <button onClick={fetchDatabases} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors duration-200" title="Refresh">
                            <RefreshCw size={13} />
                        </button>
                        <button onClick={() => setShowCreateDb(true)} className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors duration-200" title="New Database">
                            <Plus size={13} />
                        </button>
                    </div>
                </div>

                {/* Search */}
                <div className="px-2 py-2 border-b border-slate-200 dark:border-slate-800">
                    <div className="relative">
                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Filter databases..." className="w-full pl-7 pr-2 py-1.5 text-xs rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 ease-in-out"
                        />
                    </div>
                </div>

                {/* Tree */}
                <div className="flex-1 overflow-y-auto py-1">
                    {loading ? (
                        <p className="text-xs text-slate-400 px-3 py-4 text-center">Loading...</p>
                    ) : filteredDbs.length === 0 ? (
                        <p className="text-xs text-slate-400 px-3 py-4 text-center">No databases found</p>
                    ) : filteredDbs.map(db => (
                        <div key={db}>
                            {/* Database row */}
                            <button
                                onClick={() => toggleDb(db)}
                                onContextMenu={e => handleContextMenu(e, 'db', db)}
                                className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-sm rounded-md mx-1 transition-all duration-200 ease-in-out group ${selectedDb === db ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                style={{ width: 'calc(100% - 8px)' }}
                            >
                                {expanded[db] ? <ChevronDown size={12} className="shrink-0 text-slate-400" /> : <ChevronRight size={12} className="shrink-0 text-slate-400" />}
                                <Database size={13} className={`shrink-0 ${selectedDb === db ? 'text-blue-600' : 'text-slate-400'}`} />
                                <span className="truncate text-xs font-medium">{db}</span>
                            </button>

                            {/* Tables */}
                            {expanded[db] && (
                                <div className="ml-4">
                                    <div className="flex items-center justify-between px-2 py-1">
                                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Tables</span>
                                        <button onClick={() => { setSelectedDb(db); setShowCreateTable(true) }} className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors duration-200" title="New Table"><Plus size={11} /></button>
                                    </div>
                                    {(tables[db] || []).map(tbl => (
                                        <button
                                            key={tbl.name}
                                            onClick={() => setSelectedTable(tbl.name)}
                                            onContextMenu={e => handleContextMenu(e, 'table', tbl.name, db)}
                                            className={`w-full flex items-center gap-1.5 px-2 py-1.5 text-xs rounded-md mx-0.5 transition-all duration-200 ease-in-out ${selectedTable === tbl.name && selectedDb === db ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            style={{ width: 'calc(100% - 4px)' }}
                                        >
                                            {tbl.type === 'VIEW' ? <Eye size={11} className="shrink-0 text-slate-400" /> : <Table2 size={11} className="shrink-0 text-slate-400" />}
                                            <span className="truncate">{tbl.name}</span>
                                        </button>
                                    ))}
                                    {!tables[db] && <p className="text-xs text-slate-400 px-2 py-1">Loading...</p>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </aside>

            {/* Context Menu */}
            {contextMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
                    <div
                        className="fixed z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg py-1 min-w-40 animate-in duration-100"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        {contextMenu.type === 'db' ? (
                            <>
                                <button onClick={() => { setSelectedDb(contextMenu.name); setShowCreateTable(true); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-200"><Plus size={13} /> New Table</button>
                                <button onClick={() => { setSelectedDb(contextMenu.name); setActiveTab('query'); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-200"><Code2 size={13} /> Query</button>
                                <hr className="my-1 border-slate-200 dark:border-slate-700" />
                                <button onClick={() => handleDropDb(contextMenu.name)} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 transition-colors duration-200"><Trash2 size={13} /> Drop Database</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => { setSelectedTable(contextMenu.name); setActiveTab('data'); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-200"><Table2 size={13} /> Browse Data</button>
                                <button onClick={() => { setSelectedTable(contextMenu.name); setActiveTab('structure'); setContextMenu(null) }} className="w-full text-left px-3 py-1.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors duration-200"><Code2 size={13} /> Structure</button>
                                <hr className="my-1 border-slate-200 dark:border-slate-700" />
                                <button onClick={() => handleDropTable(contextMenu.db!, contextMenu.name)} className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950 flex items-center gap-2 transition-colors duration-200"><Trash2 size={13} /> Drop Table</button>
                            </>
                        )}
                    </div>
                </>
            )}

            {showCreateDb && <CreateDbModal onClose={() => { setShowCreateDb(false); fetchDatabases() }} />}
            {showCreateTable && selectedDb && <CreateTableModal db={selectedDb} onClose={() => { setShowCreateTable(false); fetchTables(selectedDb!) }} />}
        </>
    )
}

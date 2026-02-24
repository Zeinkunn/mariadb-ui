import { useEffect, useState } from 'react'
import { Plus, Trash2, Pencil, RefreshCw, Save, X } from 'lucide-react'
import { useDbStore } from '../store/dbStore'
import { getTableSchema, addColumn, modifyColumn, dropColumn } from '../api/client'
import toast from 'react-hot-toast'

const DATA_TYPES = ['INT', 'BIGINT', 'TINYINT', 'SMALLINT', 'MEDIUMINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'VARCHAR', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT', 'CHAR', 'DATE', 'DATETIME', 'TIMESTAMP', 'TIME', 'BOOLEAN', 'JSON', 'BLOB']

export default function StructurePage() {
    const { selectedDb, selectedTable } = useDbStore()
    const [schema, setSchema] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [editCol, setEditCol] = useState<any>(null)
    const [addingCol, setAddingCol] = useState(false)
    const [newCol, setNewCol] = useState({ name: '', columnType: 'VARCHAR(255)', nullable: true, default: '', comment: '' })
    const [activeSubTab, setActiveSubTab] = useState<'columns' | 'indexes' | 'sql'>('columns')

    const fetch = async () => {
        if (!selectedDb || !selectedTable) return
        setLoading(true)
        try {
            const res = await getTableSchema(selectedDb, selectedTable)
            setSchema(res.data)
        } catch (err: any) { toast.error(err.response?.data?.error) }
        finally { setLoading(false) }
    }

    useEffect(() => { fetch() }, [selectedDb, selectedTable])

    const handleAdd = async () => {
        try {
            await addColumn(selectedDb!, selectedTable!, newCol)
            toast.success('Column added')
            setAddingCol(false)
            fetch()
        } catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const handleModify = async () => {
        try {
            await modifyColumn(selectedDb!, selectedTable!, editCol.name, editCol)
            toast.success('Column updated')
            setEditCol(null)
            fetch()
        } catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const handleDrop = async (colName: string) => {
        if (!confirm(`Drop column "${colName}"?`)) return
        try {
            await dropColumn(selectedDb!, selectedTable!, colName)
            toast.success('Column dropped')
            fetch()
        } catch (err: any) { toast.error(err.response?.data?.error) }
    }

    if (!selectedDb || !selectedTable) {
        return <div className="flex items-center justify-center h-full text-slate-400 text-sm">Select a table to view its structure</div>
    }

    const ColForm = ({ data, setData, onSave, onCancel }: any) => (
        <tr className="bg-blue-50 dark:bg-blue-950">
            {['name', 'columnType', 'nullable', 'default', 'comment'].map(field => (
                <td key={field} className="px-3 py-1.5">
                    {field === 'nullable' ? (
                        <input type="checkbox" checked={data.nullable} onChange={e => setData({ ...data, nullable: e.target.checked })} className="rounded" />
                    ) : field === 'columnType' ? (
                        <input list="types" value={data.columnType} onChange={e => setData({ ...data, columnType: e.target.value })}
                            className="w-full px-2 py-1 text-xs rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    ) : (
                        <input value={data[field] || ''} onChange={e => setData({ ...data, [field]: e.target.value })}
                            className="w-full px-2 py-1 text-xs rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    )}
                </td>
            ))}
            <td className="px-3 py-1.5 flex gap-1">
                <button onClick={onSave} className="p-1 rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"><Save size={12} /></button>
                <button onClick={onCancel} className="p-1 rounded border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"><X size={12} /></button>
            </td>
        </tr>
    )

    return (
        <div className="flex flex-col h-full">
            <datalist id="types">{DATA_TYPES.map(t => <option key={t} value={t} />)}</datalist>

            {/* Sub-tabs */}
            <div className="flex items-center gap-0 px-4 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                {(['columns', 'indexes', 'sql'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveSubTab(tab)}
                        className={`px-4 py-2 text-xs font-medium capitalize border-b-2 transition-all duration-200 ease-in-out ${activeSubTab === tab ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                        {tab === 'sql' ? 'CREATE SQL' : tab}
                    </button>
                ))}
                <div className="flex-1" />
                <button onClick={fetch} className="p-1.5 mb-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out"><RefreshCw size={13} /></button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-32 text-slate-400 text-sm">Loading...</div>
            ) : schema ? (
                <div className="flex-1 overflow-auto">
                    {activeSubTab === 'columns' && (
                        <div>
                            <div className="flex items-center justify-between px-4 py-2">
                                <span className="text-xs font-semibold text-slate-500">{schema.columns?.length} columns</span>
                                <button onClick={() => setAddingCol(true)} className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 ease-in-out"><Plus size={12} /> Add Column</button>
                            </div>
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800">
                                        {['Name', 'Type', 'Nullable', 'Default', 'Key', 'Extra', 'Comment', 'Actions'].map(h => (
                                            <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {addingCol && <ColForm data={newCol} setData={setNewCol} onSave={handleAdd} onCancel={() => setAddingCol(false)} />}
                                    {schema.columns?.map((col: any) => (
                                        editCol?.name === col.name ? (
                                            <ColForm key={col.name} data={editCol} setData={setEditCol} onSave={handleModify} onCancel={() => setEditCol(null)} />
                                        ) : (
                                            <tr key={col.name} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                                                <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{col.name}</td>
                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-400 font-mono">{col.columnType}</td>
                                                <td className="px-3 py-2">{col.nullable === 'YES' ? <span className="text-green-600">YES</span> : <span className="text-red-500">NO</span>}</td>
                                                <td className="px-3 py-2 text-slate-500 font-mono">{col.default ?? <span className="italic text-slate-400">NULL</span>}</td>
                                                <td className="px-3 py-2">{col.key && <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 text-[10px] font-semibold">{col.key}</span>}</td>
                                                <td className="px-3 py-2 text-slate-500">{col.extra}</td>
                                                <td className="px-3 py-2 text-slate-400 max-w-32 truncate">{col.comment}</td>
                                                <td className="px-3 py-2">
                                                    <div className="flex gap-1">
                                                        <button onClick={() => setEditCol({ ...col, nullable: col.nullable === 'YES', default: col.default || '' })} className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors duration-200"><Pencil size={11} /></button>
                                                        <button onClick={() => handleDrop(col.name)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors duration-200"><Trash2 size={11} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeSubTab === 'indexes' && (
                        <div className="p-4">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-100 dark:bg-slate-800">
                                        {['Key Name', 'Column', 'Non Unique', 'Index Type'].map(h => <th key={h} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">{h}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {schema.indexes?.map((idx: any, i: number) => (
                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                                            <td className="px-3 py-2 font-medium text-slate-700 dark:text-slate-300">{idx.Key_name}</td>
                                            <td className="px-3 py-2 text-slate-600 dark:text-slate-400">{idx.Column_name}</td>
                                            <td className="px-3 py-2">{idx.Non_unique ? 'YES' : <span className="text-blue-600 font-semibold">UNIQUE</span>}</td>
                                            <td className="px-3 py-2 text-slate-500 font-mono">{idx.Index_type}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {activeSubTab === 'sql' && (
                        <div className="p-4">
                            <pre className="bg-slate-900 text-emerald-400 rounded-xl p-4 text-xs overflow-auto font-mono leading-relaxed whitespace-pre-wrap border border-slate-700">
                                {schema.createSql}
                            </pre>
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    )
}

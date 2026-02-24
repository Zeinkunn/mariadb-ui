import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { createTable } from '../../api/client'
import toast from 'react-hot-toast'

const TYPES = ['INT', 'BIGINT', 'TINYINT', 'VARCHAR(255)', 'TEXT', 'MEDIUMTEXT', 'LONGTEXT', 'DATE', 'DATETIME', 'TIMESTAMP', 'FLOAT', 'DOUBLE', 'DECIMAL(10,2)', 'BOOLEAN', 'JSON', 'BLOB']

export default function CreateTableModal({ db, onClose }: { db: string; onClose: () => void }) {
    const [name, setName] = useState('')
    const [engine, setEngine] = useState('InnoDB')
    const [charset, setCharset] = useState('utf8mb4')
    const [columns, setColumns] = useState([
        { name: 'id', columnType: 'INT', primaryKey: true, autoIncrement: true, nullable: false, default: '' }
    ])
    const [loading, setLoading] = useState(false)

    const addCol = () => setColumns([...columns, { name: '', columnType: 'VARCHAR(255)', primaryKey: false, autoIncrement: false, nullable: true, default: '' }])
    const removeCol = (i: number) => setColumns(columns.filter((_, ci) => ci !== i))
    const updateCol = (i: number, field: string, val: any) => {
        const next = [...columns]
            ; (next[i] as any)[field] = val
        setColumns(next)
    }

    const handleCreate = async () => {
        if (!name) return toast.error('Table name required')
        if (columns.some(c => !c.name)) return toast.error('All columns must have a name')
        setLoading(true)
        try {
            await createTable(db, { name, columns, engine, charset })
            toast.success(`Table "${name}" created`)
            onClose()
        } catch (err: any) {
            toast.error(err.response?.data?.error)
        } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Create Table in <span className="text-blue-600">{db}</span></h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors duration-200"><X size={16} /></button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-3 gap-3">
                        {[['Table Name', name, setName], ['Engine', engine, setEngine], ['Charset', charset, setCharset]].map(([label, val, setter]) => (
                            <div key={label as string}>
                                <label className="text-xs text-slate-500 mb-1 block">{label as string}</label>
                                <input value={val as string} onChange={e => (setter as any)(e.target.value)}
                                    className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                            </div>
                        ))}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Columns</span>
                            <button onClick={addCol} className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 ease-in-out"><Plus size={11} /> Add</button>
                        </div>
                        <table className="w-full text-xs border-collapse">
                            <thead><tr className="bg-slate-100 dark:bg-slate-800">
                                {['Name', 'Type', 'PK', 'AI', 'Nullable', 'Default', ''].map(h => <th key={h} className="px-2 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">{h}</th>)}
                            </tr></thead>
                            <tbody>
                                {columns.map((col, i) => (
                                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="px-2 py-1.5"><input value={col.name} onChange={e => updateCol(i, 'name', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" /></td>
                                        <td className="px-2 py-1.5"><input list="col-types" value={col.columnType} onChange={e => updateCol(i, 'columnType', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" /></td>
                                        <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={col.primaryKey} onChange={e => updateCol(i, 'primaryKey', e.target.checked)} className="rounded" /></td>
                                        <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={col.autoIncrement} onChange={e => updateCol(i, 'autoIncrement', e.target.checked)} className="rounded" /></td>
                                        <td className="px-2 py-1.5 text-center"><input type="checkbox" checked={col.nullable} onChange={e => updateCol(i, 'nullable', e.target.checked)} className="rounded" /></td>
                                        <td className="px-2 py-1.5"><input value={col.default} onChange={e => updateCol(i, 'default', e.target.value)} className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs" /></td>
                                        <td className="px-2 py-1.5"><button onClick={() => removeCol(i)} className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900 text-red-500 transition-colors duration-200"><Trash2 size={11} /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <datalist id="col-types">{TYPES.map(t => <option key={t} value={t} />)}</datalist>
                    </div>
                </div>

                <div className="flex gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
                    <button onClick={handleCreate} disabled={loading} className="flex-1 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium transition-all duration-200 ease-in-out">
                        {loading ? 'Creating...' : 'Create Table'}
                    </button>
                    <button onClick={onClose} className="flex-1 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out">Cancel</button>
                </div>
            </div>
        </div>
    )
}

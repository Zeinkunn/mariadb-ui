import { useState } from 'react'
import { X } from 'lucide-react'
import { createDatabase } from '../../api/client'
import toast from 'react-hot-toast'

export default function CreateDbModal({ onClose }: { onClose: () => void }) {
    const [name, setName] = useState('')
    const [charset, setCharset] = useState('utf8mb4')
    const [collation, setCollation] = useState('utf8mb4_unicode_ci')
    const [loading, setLoading] = useState(false)

    const handleCreate = async () => {
        if (!name) return toast.error('Database name required')
        setLoading(true)
        try {
            await createDatabase(name, charset, collation)
            toast.success(`Database "${name}" created`)
            onClose()
        } catch (err: any) {
            toast.error(err.response?.data?.error)
        } finally { setLoading(false) }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-sm p-6 space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 dark:text-slate-200">Create Database</h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors duration-200"><X size={16} /></button>
                </div>
                {[['Name', name, setName, 'text', 'e.g. myapp_db'],
                ['Charset', charset, setCharset, 'text', 'utf8mb4'],
                ['Collation', collation, setCollation, 'text', 'utf8mb4_unicode_ci']].map(([label, val, setter, type, ph]) => (
                    <div key={label as string}>
                        <label className="block text-xs text-slate-500 mb-1">{label as string}</label>
                        <input type={type as string} value={val as string} onChange={e => (setter as any)(e.target.value)} placeholder={ph as string}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                    </div>
                ))}
                <div className="flex gap-3 pt-1">
                    <button onClick={handleCreate} disabled={loading}
                        className="flex-1 py-2 text-sm rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium transition-all duration-200 ease-in-out">
                        {loading ? 'Creating...' : 'Create'}
                    </button>
                    <button onClick={onClose} className="flex-1 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out">Cancel</button>
                </div>
            </div>
        </div>
    )
}

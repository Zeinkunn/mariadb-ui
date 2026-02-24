import { useState } from 'react'
import { Download, Upload, FileText, FileDown } from 'lucide-react'
import { useDbStore } from '../store/dbStore'
import { exportDatabase, exportTableCsv, importSql } from '../api/client'
import toast from 'react-hot-toast'

export default function ImportExportPage() {
    const { selectedDb } = useDbStore()
    const [importing, setImporting] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [importDb, setImportDb] = useState(selectedDb || '')

    const handleExportSql = () => {
        if (!selectedDb) return toast.error('Select a database first')
        window.open(exportDatabase(selectedDb), '_blank')
    }

    const handleImport = async () => {
        if (!file) return toast.error('Select a .sql file')
        setImporting(true)
        try {
            await importSql(importDb, file)
            toast.success('Import successful')
            setFile(null)
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Import failed')
        } finally { setImporting(false) }
    }

    return (
        <div className="p-6 max-w-2xl space-y-6">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Import / Export</h2>

            {/* Export section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Download size={16} className="text-blue-600" />
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300">Export</h3>
                </div>
                <p className="text-xs text-slate-500">Export the selected database as a SQL dump file.</p>
                {selectedDb ? (
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Database: <span className="text-blue-600">{selectedDb}</span></span>
                        <button onClick={handleExportSql}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 ease-in-out ml-auto">
                            <FileText size={12} /> Export SQL (.sql)
                        </button>
                    </div>
                ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400">Select a database from the sidebar to export.</p>
                )}
            </div>

            {/* Import section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4">
                <div className="flex items-center gap-2">
                    <Upload size={16} className="text-emerald-600" />
                    <h3 className="font-semibold text-slate-700 dark:text-slate-300">Import SQL</h3>
                </div>
                <p className="text-xs text-slate-500">Upload a .sql file and execute it against the selected database.</p>
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">Target Database (optional)</label>
                    <input value={importDb} onChange={e => setImportDb(e.target.value)} placeholder="e.g. mydb"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                </div>
                <div>
                    <label className="text-xs text-slate-500 mb-1 block">SQL File</label>
                    <div
                        onClick={() => document.getElementById('sql-file-input')?.click()}
                        className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 ease-in-out">
                        <FileDown size={24} className="mx-auto mb-2 text-slate-400" />
                        {file ? (
                            <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{file.name} <span className="text-slate-400">({(file.size / 1024).toFixed(1)} KB)</span></p>
                        ) : (
                            <p className="text-sm text-slate-400">Click to select a .sql file</p>
                        )}
                    </div>
                    <input id="sql-file-input" type="file" accept=".sql" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
                </div>
                <button onClick={handleImport} disabled={importing || !file}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-medium transition-all duration-200 ease-in-out">
                    <Upload size={14} /> {importing ? 'Importing...' : 'Run Import'}
                </button>
            </div>
        </div>
    )
}

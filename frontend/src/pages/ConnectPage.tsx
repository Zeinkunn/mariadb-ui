import { useState } from 'react'
import { Database, Loader2, Eye, EyeOff } from 'lucide-react'
import { useConnectionStore } from '../store/connectionStore'
import { connect } from '../api/client'
import toast from 'react-hot-toast'

export default function ConnectPage() {
    const { config, setConnected } = useConnectionStore()
    const [form, setForm] = useState({
        host: config?.host || 'localhost',
        port: config?.port || '3306',
        user: config?.user || 'root',
        password: config?.password || '',
    })
    const [loading, setLoading] = useState(false)
    const [showPass, setShowPass] = useState(false)

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await connect(form)
            setConnected(true, form, res.data.version, res.data.currentUser)
            toast.success(`Connected as ${res.data.currentUser}`)
        } catch (err: any) {
            toast.error(err.response?.data?.error || 'Connection failed')
        } finally {
            setLoading(false)
        }
    }

    const field = (label: string, key: keyof typeof form, type = 'text', extra?: React.ReactNode) => (
        <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{label}</label>
            <div className="relative">
                <input
                    type={type}
                    value={form[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out text-sm"
                />
                {extra}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                        <Database className="text-white" size={28} />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">MariaDB UI</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Connect to your database server</p>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                    <form onSubmit={handleConnect} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            {field('Host', 'host')}
                            {field('Port', 'port')}
                        </div>
                        {field('Username', 'user')}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    className="w-full px-3 py-2.5 pr-10 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                                >
                                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium text-sm transition-all duration-200 ease-in-out flex items-center justify-center gap-2 mt-2"
                        >
                            {loading ? <><Loader2 size={16} className="animate-spin" /> Connecting...</> : 'Connect'}
                        </button>
                    </form>
                </div>
                <p className="text-center text-xs text-slate-400 mt-4">Connecting to localhost MariaDB server</p>
            </div>
        </div>
    )
}

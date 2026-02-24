import { useEffect, useState } from 'react'
import { Plus, Trash2, KeyRound, RefreshCw } from 'lucide-react'
import { getUsers, createUser, dropUser, getUserGrants, grantPrivileges, revokePrivileges, setUserPassword } from '../api/client'
import toast from 'react-hot-toast'

const ALL_PRIVS = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'INDEX', 'ALTER', 'CREATE TEMPORARY TABLES', 'LOCK TABLES', 'EXECUTE', 'CREATE VIEW', 'SHOW VIEW', 'CREATE ROUTINE', 'ALTER ROUTINE', 'EVENT', 'TRIGGER']

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([])
    const [selected, setSelected] = useState<any>(null)
    const [grants, setGrants] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const [showCreate, setShowCreate] = useState(false)
    const [newUser, setNewUser] = useState({ user: '', host: '%', password: '' })
    const [grantForm, setGrantForm] = useState({ privileges: 'ALL PRIVILEGES', database: '*', table: '*', withGrant: false })
    const [showPassReset, setShowPassReset] = useState(false)
    const [newPass, setNewPass] = useState('')

    const fetchUsers = async () => {
        setLoading(true)
        try { const r = await getUsers(); setUsers(r.data) }
        catch (err: any) { toast.error(err.response?.data?.error) }
        finally { setLoading(false) }
    }

    const fetchGrants = async (user: string, host: string) => {
        try { const r = await getUserGrants(user, host); setGrants(r.data) }
        catch { setGrants([]) }
    }

    useEffect(() => { fetchUsers() }, [])

    const handleCreate = async () => {
        try {
            await createUser(newUser.user, newUser.host, newUser.password)
            toast.success('User created'); setShowCreate(false); fetchUsers()
        } catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const handleDrop = async (user: string, host: string) => {
        if (!confirm(`Drop user '${user}'@'${host}'?`)) return
        try { await dropUser(user, host); toast.success('User dropped'); setSelected(null); fetchUsers() }
        catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const handleGrant = async () => {
        try {
            await grantPrivileges(selected.user, selected.host, { privileges: grantForm.privileges, on: { database: grantForm.database, table: grantForm.table }, withGrant: grantForm.withGrant })
            toast.success('Privileges granted'); fetchGrants(selected.user, selected.host)
        } catch (err: any) { toast.error(err.response?.data?.error) }
    }

    const handlePassReset = async () => {
        try {
            await setUserPassword(selected.user, selected.host, newPass)
            toast.success('Password updated'); setShowPassReset(false); setNewPass('')
        } catch (err: any) { toast.error(err.response?.data?.error) }
    }

    return (
        <div className="flex h-full">
            {/* User list */}
            <div className="w-64 shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Users</span>
                    <div className="flex gap-1">
                        <button onClick={fetchUsers} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors duration-200"><RefreshCw size={12} /></button>
                        <button onClick={() => setShowCreate(true)} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors duration-200"><Plus size={12} /></button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto py-1">
                    {users.map((u, i) => (
                        <button key={i} onClick={() => { setSelected(u); fetchGrants(u.user, u.host) }}
                            className={`w-full text-left px-3 py-2 text-sm transition-all duration-200 ease-in-out ${selected?.user === u.user && selected?.host === u.host ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                            <div className="font-medium text-xs truncate">{u.user}</div>
                            <div className="text-[10px] text-slate-400">@{u.host}</div>
                        </button>
                    ))}
                </div>

                {/* Create user form */}
                {showCreate && (
                    <div className="border-t border-slate-200 dark:border-slate-800 p-3 space-y-2">
                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">New User</p>
                        {[['User', 'user'], ['Host', 'host'], ['Password', 'password']].map(([label, key]) => (
                            <div key={key}>
                                <label className="text-[10px] text-slate-500">{label}</label>
                                <input type={key === 'password' ? 'password' : 'text'} value={(newUser as any)[key]} onChange={e => setNewUser({ ...newUser, [key]: e.target.value })}
                                    className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                            </div>
                        ))}
                        <div className="flex gap-2">
                            <button onClick={handleCreate} className="flex-1 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 ease-in-out">Create</button>
                            <button onClick={() => setShowCreate(false)} className="flex-1 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out">Cancel</button>
                        </div>
                    </div>
                )}
            </div>

            {/* User details */}
            {selected ? (
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200">'{selected.user}'@'{selected.host}'</h2>
                            <p className="text-xs text-slate-500">{selected.plugin} · {selected.account_locked === 'Y' ? '🔒 Locked' : '✓ Active'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setShowPassReset(true)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out"><KeyRound size={12} /> Set Password</button>
                            <button onClick={() => handleDrop(selected.user, selected.host)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-200 ease-in-out"><Trash2 size={12} /> Drop User</button>
                        </div>
                    </div>

                    {showPassReset && (
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Reset Password</p>
                            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New password"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                            <div className="flex gap-2">
                                <button onClick={handlePassReset} className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 ease-in-out">Save</button>
                                <button onClick={() => setShowPassReset(false)} className="px-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out">Cancel</button>
                            </div>
                        </div>
                    )}

                    {/* Grant privileges */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 space-y-3">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Grant Privileges</p>
                        <div className="grid grid-cols-3 gap-3 text-xs">
                            <div>
                                <label className="text-[10px] text-slate-500 mb-1 block">Privileges</label>
                                <input value={grantForm.privileges} onChange={e => setGrantForm({ ...grantForm, privileges: e.target.value })}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 mb-1 block">Database</label>
                                <input value={grantForm.database} onChange={e => setGrantForm({ ...grantForm, database: e.target.value })}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-500 mb-1 block">Table</label>
                                <input value={grantForm.table} onChange={e => setGrantForm({ ...grantForm, table: e.target.value })}
                                    className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all duration-200 ease-in-out" />
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="withgrant" checked={grantForm.withGrant} onChange={e => setGrantForm({ ...grantForm, withGrant: e.target.checked })} className="rounded" />
                            <label htmlFor="withgrant" className="text-xs text-slate-600 dark:text-slate-400">WITH GRANT OPTION</label>
                        </div>
                        <button onClick={handleGrant} className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 ease-in-out">Grant</button>
                    </div>

                    {/* Current grants */}
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Current Grants</p>
                        {grants.length === 0 ? <p className="text-xs text-slate-400">No grants found</p> : (
                            <div className="space-y-1">
                                {grants.map((g, i) => (
                                    <div key={i} className="font-mono text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">{g}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Select a user</div>
            )}
        </div>
    )
}

import { useState } from 'react'
import {
    Database, Code2, Table2, Layers, Users, Server,
    ArrowUpDown, LogOut, Moon, Sun, PanelLeftClose, PanelLeft
} from 'lucide-react'
import { useDbStore } from '../store/dbStore'
import { useConnectionStore } from '../store/connectionStore'
import { useThemeStore } from '../store/themeStore'
import { disconnect } from '../api/client'
import toast from 'react-hot-toast'
import Sidebar from '../components/Sidebar'
import QueryPage from './QueryPage'
import DataPage from './DataPage'
import StructurePage from './StructurePage'
import UsersPage from './UsersPage'
import ServerPage from './ServerPage'
import ImportExportPage from './ImportExportPage'

const NAV_ITEMS = [
    { id: 'query', icon: Code2, label: 'Query' },
    { id: 'data', icon: Table2, label: 'Data' },
    { id: 'structure', icon: Layers, label: 'Structure' },
    { id: 'users', icon: Users, label: 'Users' },
    { id: 'server', icon: Server, label: 'Server' },
    { id: 'importexport', icon: ArrowUpDown, label: 'Import/Export' },
] as const

export default function Dashboard() {
    const { activeTab, setActiveTab, sidebarOpen, setSidebarOpen, selectedDb, selectedTable } = useDbStore()
    const { version, currentUser, disconnect: storeDisconnect } = useConnectionStore()
    const { dark, toggle } = useThemeStore()

    const handleDisconnect = async () => {
        try { await disconnect() } catch { }
        storeDisconnect()
        toast.success('Disconnected')
    }

    const pageMap: Record<string, React.ReactNode> = {
        query: <QueryPage />,
        data: <DataPage />,
        structure: <StructurePage />,
        users: <UsersPage />,
        server: <ServerPage />,
        importexport: <ImportExportPage />,
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
            {/* Top Header */}
            <header className="h-11 shrink-0 flex items-center gap-3 px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all duration-200 ease-in-out">
                    {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Database size={12} className="text-white" />
                    </div>
                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">MariaDB UI</span>
                </div>

                {/* Breadcrumb */}
                {selectedDb && (
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span className="text-slate-300 dark:text-slate-600">/</span>
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedDb}</span>
                        {selectedTable && (
                            <>
                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedTable}</span>
                            </>
                        )}
                    </div>
                )}

                <div className="flex-1" />

                {/* Version badge */}
                {version && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">{version}</span>}
                <span className="text-xs text-slate-500">{currentUser}</span>

                <button onClick={toggle} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-all duration-200 ease-in-out">
                    {dark ? <Sun size={14} /> : <Moon size={14} />}
                </button>
                <button onClick={handleDisconnect} className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 ease-in-out">
                    <LogOut size={12} /> Disconnect
                </button>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <Sidebar />

                {/* Main area */}
                <div className="flex flex-1 overflow-hidden">
                    {/* Nav tabs (vertical left strip) */}
                    <nav className="w-10 shrink-0 flex flex-col items-center py-2 gap-1 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
                        {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                            <button key={id} onClick={() => setActiveTab(id)}
                                title={label}
                                className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 ease-in-out ${activeTab === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                <Icon size={15} />
                            </button>
                        ))}
                    </nav>

                    {/* Page content */}
                    <main className="flex-1 overflow-hidden bg-white dark:bg-slate-900 relative">
                        {pageMap[activeTab]}
                    </main>
                </div>
            </div>

            {/* Status bar */}
            <footer className="h-6 shrink-0 flex items-center px-4 gap-4 bg-blue-600 text-white text-[10px]">
                <span>MariaDB UI</span>
                {selectedDb && <span>📁 {selectedDb}</span>}
                {selectedTable && <span>🗂 {selectedTable}</span>}
                <div className="flex-1" />
                <span>localhost</span>
                <span className="opacity-70">MariaDB {version}</span>
            </footer>
        </div>
    )
}

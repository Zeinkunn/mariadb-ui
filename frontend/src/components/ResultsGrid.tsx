interface ResultsGridProps {
    rows: any[]
    columns: string[]
}

export default function ResultsGrid({ rows, columns }: ResultsGridProps) {
    return (
        <div className="overflow-auto h-full">
            <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 z-10">
                    <tr className="bg-slate-100 dark:bg-slate-800">
                        {columns.map(col => (
                            <th key={col} className="px-3 py-2 text-left font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                {col}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-150">
                            {columns.map(col => (
                                <td key={col} className="px-3 py-1.5 text-slate-700 dark:text-slate-300 max-w-64">
                                    <span className={`block truncate ${row[col] === null ? 'text-slate-400 italic' : ''}`}>
                                        {row[col] === null ? 'NULL' : String(row[col])}
                                    </span>
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

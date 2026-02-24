import { useEffect, useRef, useState } from 'react'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { sql } from '@codemirror/lang-sql'
import { oneDark } from '@codemirror/theme-one-dark'
import { useThemeStore } from '../store/themeStore'

interface SQLEditorProps {
    value: string
    onChange: (v: string) => void
    onRun?: () => void
}

export default function SQLEditor({ value, onChange, onRun }: SQLEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null)
    const viewRef = useRef<EditorView | null>(null)
    const { dark } = useThemeStore()

    useEffect(() => {
        if (!editorRef.current) return

        const runKeys = keymap.of([{
            key: 'Ctrl-Enter', run: () => { onRun?.(); return true }
        }])

        const state = EditorState.create({
            doc: value,
            extensions: [
                lineNumbers(),
                history(),
                highlightActiveLine(),
                keymap.of([...defaultKeymap, ...historyKeymap]),
                runKeys,
                sql(),
                ...(dark ? [oneDark] : []),
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) onChange(update.state.doc.toString())
                }),
                EditorView.theme({
                    '&': { height: '100%' },
                    '.cm-scroller': { overflow: 'auto', fontFamily: "'JetBrains Mono', 'Fira Code', monospace" },
                }),
            ],
        })

        const view = new EditorView({ state, parent: editorRef.current })
        viewRef.current = view

        return () => { view.destroy(); viewRef.current = null }
    }, [dark])

    // Sync external value changes
    useEffect(() => {
        const view = viewRef.current
        if (!view) return
        const current = view.state.doc.toString()
        if (current !== value) {
            view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
        }
    }, [value])

    return (
        <div ref={editorRef} className="h-full border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden" />
    )
}

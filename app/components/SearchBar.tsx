"use client"

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Buttons from './Buttons'

type SearchBarProps = {
    placeholder?: string;
    filters?: string;
    addbutton?: boolean;
    slash?: boolean;
    shlash?: boolean;
}

type SearchScope = 'files' | 'users';

type SuggestionItem = {
    label: string;
    query: string;
    scope: SearchScope;
    isAction?: boolean;
}

const SearchBar = ({ placeholder, filters, addbutton, slash, shlash }: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const wrapperRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const scopeFromUrl = searchParams.get('scope') === 'users' ? 'users' : 'files'
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [scope, setScope] = useState<SearchScope>(scopeFromUrl)
    const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const isSlashEnabled = slash;

    const currentQueryFromUrl = useMemo(() => searchParams.get('q') || '', [searchParams])
    const currentScopeFromUrl = useMemo<SearchScope>(() => (searchParams.get('scope') === 'users' ? 'users' : 'files'), [searchParams])

    const parseInput = (rawValue: string) => {
        const trimmed = rawValue.trim()
        if (/^\/users\b/i.test(trimmed)) {
            return { scope: 'users' as SearchScope, query: trimmed.replace(/^\/users\b/i, '').trim() }
        }
        if (/^\/files\b/i.test(trimmed)) {
            return { scope: 'files' as SearchScope, query: trimmed.replace(/^\/files\b/i, '').trim() }
        }

        // Default behavior: plain query always searches files.
        return { scope: 'files' as SearchScope, query: trimmed }
    }

    const buildTarget = (targetScope: SearchScope, targetQuery: string) => {
        const params = new URLSearchParams()
        params.set('scope', targetScope)
        if (targetQuery) {
            params.set('q', targetQuery)
        }
        return `/browse?${params.toString()}`
    }

    useEffect(() => {
        setQuery(currentQueryFromUrl)
        setScope(currentScopeFromUrl)
    }, [currentQueryFromUrl, currentScopeFromUrl])

    useEffect(() => {
        if (!isSlashEnabled) {
            return
        }

        const handleSlashFocus = (event: KeyboardEvent) => {
            if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) {
                return
            }

            const activeElement = document.activeElement as HTMLElement | null
            const isTypingInField =
                activeElement instanceof HTMLInputElement ||
                activeElement instanceof HTMLTextAreaElement ||
                activeElement instanceof HTMLSelectElement ||
                activeElement?.isContentEditable

            if (isTypingInField) {
                return
            }

            event.preventDefault()
            inputRef.current?.focus()
        }

        window.addEventListener('keydown', handleSlashFocus)
        return () => {
            window.removeEventListener('keydown', handleSlashFocus)
        }
    }, [isSlashEnabled])

    useEffect(() => {
        const trimmed = query.trim()
        if (trimmed.length < 2) {
            setSuggestions([])
            return
        }

        const timer = setTimeout(async () => {
            try {
                const parsed = parseInput(trimmed)
                const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(parsed.query)}&scope=${parsed.scope}`)
                const data = await res.json()
                const baseItems = (Array.isArray(data.items) ? data.items : []).map((item: string) => ({
                    label: String(item),
                    query: String(item),
                    scope: parsed.scope,
                })) as SuggestionItem[]

                if (parsed.query.length >= 2) {
                    if (parsed.scope === 'files') {
                        baseItems.push({
                            label: `Search "${parsed.query}" in users`,
                            query: parsed.query,
                            scope: 'users',
                            isAction: true,
                        })
                    } else {
                        baseItems.push({
                            label: `Search "${parsed.query}" in files`,
                            query: parsed.query,
                            scope: 'files',
                            isAction: true,
                        })
                    }
                }

                setSuggestions(baseItems)
            } catch {
                setSuggestions([])
            }
        }, 180)

        return () => clearTimeout(timer)
    }, [query, scope])

    useEffect(() => {
        const onOutsideClick = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false)
            }
        }

        document.addEventListener('mousedown', onOutsideClick)
        return () => document.removeEventListener('mousedown', onOutsideClick)
    }, [])

    const submitSearch = (value?: string, forcedScope?: SearchScope) => {
        const parsed = parseInput(value ?? query)
        const finalQuery = parsed.query
        const finalScope = forcedScope ?? parsed.scope
        const target = buildTarget(finalScope, finalQuery)
        const currentTarget = buildTarget(currentScopeFromUrl, currentQueryFromUrl)

        if (pathname === '/browse' && target === currentTarget) {
            setShowSuggestions(false)
            return
        }

        setScope(finalScope)
        if (value === undefined) {
            setQuery(finalQuery)
        }
        setShowSuggestions(false)
        router.push(target)
    }

  return (
    <div ref={wrapperRef} className="relative flex flex-row w-full">
        <div className="relative w-full">
            <input 
                ref={inputRef}
                type="text" 
                placeholder={placeholder}
                value={query}
                onChange={(e) => {
                    const nextValue = e.target.value
                    setQuery(nextValue)
                    if (/^\/users\b/i.test(nextValue.trim())) {
                        setScope('users')
                    }
                    if (/^\/files\b/i.test(nextValue.trim())) {
                        setScope('files')
                    }
                    setShowSuggestions(true)
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault()
                        submitSearch()
                    }
                    if (e.key === 'Escape') {
                        setShowSuggestions(false)
                    }
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full px-12 py-2 border border-(--ui-border) rounded-full bg-(--glass-bg) backdrop-blur-md text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-0 hover:bg-(--glass-bg-hover) focus:bg-(--glass-bg-hover) transition-colors"
            />
            <Buttons
                type="ghost"
                onClick={() => submitSearch()}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted) p-0"
                ariaLabel="Submit search"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
            </Buttons>

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-xl border border-(--component-border) bg-(--component-bg) shadow-lg z-50 overflow-hidden">
                    {suggestions.map((item) => (
                        <Buttons
                            key={`${item.label}-${item.scope}`}
                            type="ghost"
                            className={`w-full text-left px-4 py-2 text-(--text-primary) hover:bg-(--glass-bg-hover) ${item.isAction ? 'border-t border-(--component-border)' : ''}`}
                            onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()}
                            onClick={() => submitSearch(item.query, item.scope)}
                        >
                            {item.label}
                        </Buttons>
                    ))}
                </div>
            )}
        </div>
        {addbutton && (
            <Buttons
                type="primary"
                onClick={() => submitSearch()}
                className="ml-1.5 rounded-full"
                text="Search"
            />
        )}
    </div>
  )
}

export default SearchBar
"use client"

import React, { useEffect, useRef } from 'react'

type SearchBarProps = {
    placeholder?: string;
    filters?: string;
    addbutton?: boolean;
    slash?: boolean;
    shlash?: boolean;
}

const SearchBar = ({ placeholder, filters, addbutton, slash, shlash }: SearchBarProps) => {
    const inputRef = useRef<HTMLInputElement>(null)
    const isSlashEnabled = slash;

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

  return (
    <div className="relative flex flex-row w-full">
        <div className="relative w-full">
            <input 
                                ref={inputRef}
                type="text" 
                placeholder={placeholder}
                className="w-full px-12 py-2 border border-(--ui-border) rounded-full bg-(--glass-bg) backdrop-blur-md text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-0 hover:bg-(--glass-bg-hover) focus:bg-(--glass-bg-hover) transition-colors"
            />
            <button className="absolute left-4 top-1/2 -translate-y-1/2 text-(--text-muted) cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
                </svg>
            </button>
        </div>
        {addbutton && (
            <button className="px-4 py-2 ml-1.5 border border-(--ui-border) rounded-full bg-(--glass-bg) backdrop-blur-md text-(--text) font-medium hover:bg-(--glass-bg-hover) focus:bg-(--glass-bg-hover) transition-colors cursor-pointer">
                Search
            </button>
        )}
    </div>
  )
}

export default SearchBar
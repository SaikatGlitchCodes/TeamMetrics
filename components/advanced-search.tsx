"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

interface AdvancedSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
}

export function AdvancedSearch({
  onSearch,
  placeholder = "Search developers by name or username...",
}: AdvancedSearchProps) {
  const [query, setQuery] = useState("")

  const handleChange = (value: string) => {
    setQuery(value)
    onSearch(value)
  }

  const handleClear = () => {
    setQuery("")
    onSearch("")
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-10 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      {query && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>
      )}
    </div>
  )
}

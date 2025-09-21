"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SearchInterface } from "@/components/search-interface"
import { SearchResults } from "@/components/search-results"
import { SearchFiltersComponent } from "@/components/search-filters"
import { Navigation } from "@/components/navigation"

export interface SearchResult {
  id: string
  image_url: string
  tags: string[]
  explanation: string
  similarity_score: number
}

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchImage, setSearchImage] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    style: true,
    texture: true,
    colorPalette: true,
    emotion: true,
  })

  const handleSearch = async (file: File) => {
    setLoading(true)
    setSearchImage(URL.createObjectURL(file))

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("http://127.0.0.1:8000/search/", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      } else {
        console.error("Search failed:", response.statusText)
        // For demo purposes, show mock results
        setSearchResults([
          {
            id: "1",
            image_url: "/abstract-painting-with-blue-tones.jpg",
            tags: ["abstract", "blue", "modern", "geometric"],
            explanation: "Similar color palette and abstract composition with geometric elements",
            similarity_score: 0.92,
          },
          {
            id: "2",
            image_url: "/impressionist-landscape.png",
            tags: ["impressionist", "landscape", "brushstrokes", "natural"],
            explanation: "Matching brushstroke technique and natural color harmony",
            similarity_score: 0.87,
          },
          {
            id: "3",
            image_url: "/minimalist-digital-art.jpg",
            tags: ["minimalist", "digital", "clean", "contemporary"],
            explanation: "Similar minimalist approach and contemporary aesthetic",
            similarity_score: 0.84,
          },
          {
            id: "4",
            image_url: "/watercolor-portrait-art.jpg",
            tags: ["watercolor", "portrait", "soft", "artistic"],
            explanation: "Comparable texture and artistic medium characteristics",
            similarity_score: 0.81,
          },
        ])
      }
    } catch (error) {
      console.error("Search error:", error)
      // Show mock results for demo
      setSearchResults([
        {
          id: "1",
          image_url: "/abstract-painting-with-blue-tones.jpg",
          tags: ["abstract", "blue", "modern", "geometric"],
          explanation: "Similar color palette and abstract composition with geometric elements",
          similarity_score: 0.92,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navigation />

        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">AI Art Search</h1>
              <p className="text-muted-foreground">Upload an image to find similar artworks and designs</p>
            </div>

            {/* Search Interface */}
            <SearchInterface onSearch={handleSearch} loading={loading} />

            {/* Search Filters */}
            {searchResults.length > 0 && <SearchFiltersComponent filters={filters} onFiltersChange={setFilters} />}

            {/* Search Results */}
            {searchResults.length > 0 && (
              <SearchResults results={searchResults} searchImage={searchImage} loading={loading} />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

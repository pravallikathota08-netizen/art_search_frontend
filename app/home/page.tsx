"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SearchInterface } from "@/components/search-interface"
import { SearchResults } from "@/components/search-results"
import { SearchFiltersComponent } from "@/components/search-filters"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"

export interface SearchResult {
  imageUrl: string
  tags: string[]
  matchReason: string
  similarity: number
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

  // 🎨 Palette state
  const [colors, setColors] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)

  // 🔑 Token from localStorage
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth-token") : null

  // Extract palette from uploaded image
  const handleExtractPalette = async (file: File) => {
    if (!token) return
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await fetch("http://127.0.0.1:8000/palette/extract", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (response.ok) {
        const data = await response.json()
        setColors(data.colors || [])
      } else {
        console.error("Palette extract failed:", response.statusText)
      }
    } catch (err) {
      console.error("Palette error:", err)
    }
  }

  // Run search with filters + optional color
  const runSearch = async (file?: File, color?: string) => {
    if (!token || !lastFile) return
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file || lastFile)
      formData.append("style", String(filters.style))
      formData.append("texture", String(filters.texture))
      formData.append("colorPalette", String(filters.colorPalette))
      formData.append("emotion", String(filters.emotion))
      if (color) formData.append("selected_color", color)

      const response = await fetch("http://127.0.0.1:8000/search/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        const results = await response.json()
        setSearchResults(results)
      } else {
        console.error("Search failed:", response.statusText)
      }
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setLoading(false)
    }
  }

  // Called when user uploads image (but don’t search yet)
  const handleSearch = async (file: File) => {
    setLastFile(file)
    setSearchImage(URL.createObjectURL(file))
    await handleExtractPalette(file) // just extract palette
    setSearchResults([]) // clear old results until user clicks Search
  }

  // Called when user clicks a color
  const handleColorClick = async (color: string) => {
    setSelectedColor(color)
    await runSearch(undefined, color)
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
              <p className="text-muted-foreground">
                Upload an image, choose filters, and refine by color palette, style, texture, or emotion
              </p>
            </div>

            {/* 🎨 Palette */}
            {colors.length > 0 && (
              <div className="flex flex-col items-center space-y-4">
                <h3 className="text-xl font-semibold">Extracted Color Palette</h3>
                <div className="flex gap-4">
                  {colors.map((color) => (
                    <div
                      key={color}
                      onClick={() => handleColorClick(color)}
                      style={{
                        backgroundColor: color,
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        border:
                          selectedColor === color
                            ? "3px solid black"
                            : "1px solid gray",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
                {selectedColor && (
                  <p className="text-sm">Selected Color: {selectedColor}</p>
                )}
              </div>
            )}

            {/* Upload/Search */}
            <SearchInterface onSearch={handleSearch} loading={loading} />

            {/* Filters + Search button */}
            {lastFile && (
              <div className="space-y-4">
                <SearchFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                />
                <Button
                  onClick={() => runSearch()}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Searching..." : "Search with Selected Filters"}
                </Button>
              </div>
            )}

            {/* Results */}
            {searchResults.length > 0 && (
              <SearchResults
                results={searchResults}
                searchImage={searchImage}
                filters={filters}             
                selectedColor={selectedColor} 
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

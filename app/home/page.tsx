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

  const [weights, setWeights] = useState({
    style: 25,
    texture: 25,
    colorPalette: 25,
    emotion: 25,
  })

  const [colors, setColors] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)

  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth-token") : null

  // 🎨 Extract Palette
  const handleExtractPalette = async (file: File) => {
    if (!token) return
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("http://127.0.0.1:8000/palette/extract", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (res.ok) {
        const data = await res.json()
        setColors(data.colors || [])
      }
    } catch (e) {
      console.error("Palette extract error", e)
    }
  }

  // 🧠 Search Logic
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

      // Normalize weights to 1.0
      const totalActive = Object.entries(weights)
        .filter(([k]) => filters[k as keyof typeof filters])
        .reduce((s, [, v]) => s + v, 0)
      const norm = totalActive > 0 ? totalActive : 1

      formData.append("style_weight", String(weights.style / norm))
      formData.append("texture_weight", String(weights.texture / norm))
      formData.append("palette_weight", String(weights.colorPalette / norm))
      formData.append("emotion_weight", String(weights.emotion / norm))

      const response = await fetch("http://127.0.0.1:8000/search/", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })
      if (response.ok) {
        const data = await response.json()
        console.log("🔍 Search response:", data)
  
        if (Array.isArray(data.results)) {
          setSearchResults(data.results)
        } else if (data.results) {
          setSearchResults([data.results])
        } else if (Array.isArray(data)) {
          setSearchResults(data)
        } else {
          setSearchResults([])
        }
  
        console.table(data.results || data)
      } else {
        console.error("Search failed:", await response.text())
        setSearchResults([])
      }
    } catch (err) {
      console.error("Search error:", err)
    } finally {
      setLoading(false)
    }
  }
  

  const handleSearch = async (file: File) => {
    setLastFile(file)
    setSearchImage(URL.createObjectURL(file))
    await handleExtractPalette(file)
    setSearchResults([])
  }

  const handleColorClick = async (color: string | null) => {
    setSelectedColor(color)
    if (color) await runSearch(undefined, color)
    else await runSearch()
  }

  // 🎚 Manual Slider Control (block >100 total)
  const updateWeight = (key: string, newVal: number) => {
    const activeKeys = Object.keys(filters).filter(
      (k) => filters[k as keyof typeof filters]
    )

    const currentTotal = activeKeys.reduce(
      (sum, k) => sum + weights[k as keyof typeof weights],
      0
    )

    const currentVal = weights[key as keyof typeof weights]
    const totalAfterChange = currentTotal - currentVal + newVal

    // Block if total > 100
    if (totalAfterChange > 100) return

    setWeights({ ...weights, [key]: newVal })
  }

  const totalSelected = Object.entries(weights)
    .filter(([k]) => filters[k as keyof typeof filters])
    .reduce((s, [, v]) => s + v, 0)

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
                Upload an image first, extract color palette, then search by filters & weights
              </p>
            </div>

            {/*{/* Palette */}
{colors.length > 0 && (
  <div className="flex flex-col items-center space-y-4">
    <h3 className="text-xl font-semibold">Extracted Color Palette</h3>

    {/* Color circles */}
    <div className="flex gap-6 flex-wrap justify-center">
      {/* None option */}
      <div className="flex flex-col items-center space-y-1">
        <div
          onClick={() => handleColorClick(null)}
          className={`w-10 h-10 flex items-center justify-center rounded-full border ${
            selectedColor === null
              ? "border-4 border-black"
              : "border-gray-400"
          } cursor-pointer bg-white text-sm`}
        >
          None
        </div>
        <span className="text-xs text-gray-600 font-medium">None</span>
      </div>

      {/* Color options */}
      {colors.map((color) => (
        <div key={color} className="flex flex-col items-center space-y-1">
          <div
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
          <span className="text-xs text-gray-600 font-medium">
            {color.toUpperCase()}
          </span>
        </div>
      ))}
    </div>

    {selectedColor && (
      <p className="text-sm mt-2">
        Selected Color:{" "}
        <span className="font-medium">{selectedColor}</span>
      </p>
    )}
  </div>
)}


            {/* Upload */}
            <SearchInterface onSearch={handleSearch} loading={loading} />

            {/* Filters + Weights */}
            {lastFile && (
              <div className="space-y-6">
                <SearchFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                />

                <div className="space-y-4">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    🎛️ Adjust Feature Weights
                  </h3>

                  {Object.entries(weights).map(([key, value]) => {
                    const isActive = filters[key as keyof typeof filters]
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <label className="w-32 capitalize">{key}</label>
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={value}
                          disabled={!isActive}
                          onChange={(e) =>
                            isActive &&
                            updateWeight(key, parseInt(e.target.value, 10))
                          }
                          className={`flex-1 ${
                            isActive
                              ? "cursor-pointer"
                              : "opacity-40 cursor-not-allowed"
                          }`}
                        />
                        <span
                          className={`w-12 text-right font-medium ${
                            isActive ? "text-black" : "text-gray-400"
                          }`}
                        >
                          {value.toFixed(0)}%
                        </span>
                      </div>
                    )
                  })}

                  <div className="text-sm mt-2 font-semibold">
                    Total: {totalSelected.toFixed(0)}%
                    {totalSelected > 100 && (
                      <span className="text-red-500 ml-2">
                        (Cannot exceed 100%)
                      </span>
                    )}
                  </div>
                </div>

                <Button
                  onClick={() => runSearch()}
                  disabled={loading || totalSelected === 0}
                  className="w-full"
                >
                  {loading ? "Searching..." : "Search with Selected Filters"}
                </Button>
              </div>
            )}

            {/* Results */}
            {searchResults && (
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

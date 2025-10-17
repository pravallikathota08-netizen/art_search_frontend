"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SearchInterface } from "@/components/search-interface"
import { SearchResults } from "@/components/search-results"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Layers, Palette, Eye } from "lucide-react"

export interface SearchResult {
  imageUrl: string
  tags?: string[]
  matchReason?: string
  similarity: number
  score?: number
}

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searchImage, setSearchImage] = useState<string | null>(null)
  const [filters] = useState({
    style: true,
    texture: true,
    color: true,
    emotion: true,
  })

  const [weights, setWeights] = useState({
    style: 25,
    texture: 25,
    color: 25,
    emotion: 25,
  })

  const [colors, setColors] = useState<string[]>([])
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const [lastFile, setLastFile] = useState<File | null>(null)
  const [totalWarning, setTotalWarning] = useState(false)

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

  // 🧠 Run Search
  const runSearch = async (file?: File, color?: string) => {
    if (!token || !lastFile) return

    // 🧩 Ensure at least one filter
    const activeFilters = Object.keys(filters).filter(
      (key) => filters[key as keyof typeof filters]
    )
    if (activeFilters.length === 0) {
      alert("No filters selected. Please enable at least one filter.")
      return
    }

    // ⚖️ Normalize weights to 100 %
    let total = Object.values(weights).reduce((s, v) => s + v, 0)
    let newWeights = { ...weights }

    if (total === 0) {
      newWeights = { style: 25, texture: 25, color: 25, emotion: 25 }
      total = 100
    } else if (total !== 100) {
      newWeights = Object.fromEntries(
        Object.entries(weights).map(([k, v]) => [k, (v / total) * 100])
      ) as typeof weights
      total = 100
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file || lastFile)
      if (color) formData.append("selected_color", color)

      formData.append("style_weight", String(newWeights.style / 100))
      formData.append("texture_weight", String(newWeights.texture / 100))
      formData.append("color_weight", String(newWeights.color/ 100))
      formData.append("emotion_weight", String(newWeights.emotion / 100))

      const response = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setSearchResults(Array.isArray(data.results) ? data.results : [data.results])
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

  // 🎚 Total weight guard
  const updateWeight = (key: string, newVal: number) => {
    const newWeights = { ...weights, [key]: newVal }
    const total = Object.values(newWeights).reduce((s, v) => s + v, 0)
    if (total > 100) {
      setTotalWarning(true)
      return
    }
    setTotalWarning(false)
    setWeights(newWeights)
  }

  const totalSelected = Object.values(weights).reduce((s, v) => s + v, 0)

  const icons: Record<string, JSX.Element> = {
    style: <Sparkles className="h-5 w-5 text-primary" />,
    texture: <Layers className="h-5 w-5 text-green-500" />,
    color: <Palette className="h-5 w-5 text-yellow-500" />,
    emotion: <Eye className="h-5 w-5 text-pink-500" />,
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-2 sm:px-4 py-6 sm:py-8 relative">
          <div className="max-w-6xl mx-auto space-y-10">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">🎨 AI Art Search</h1>
              <p className="text-muted-foreground">
                Upload an image, adjust feature weights, and explore visually similar artworks
              </p>
            </div>

            {/* Upload */}
            <SearchInterface onSearch={handleSearch} loading={loading} />

            {/* Filters + Weights */}
            {lastFile && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold">🎛️ Adjust Feature Weights</h3>

                {Object.entries(weights).map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {icons[key]}
                        <label className="capitalize font-medium">{key}</label>
                      </div>
                      <span className="text-sm text-gray-500">{value}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">0%</span>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) => updateWeight(key, parseInt(e.target.value, 10))}
                        className="w-full accent-primary"
                      />
                      <span className="text-xs text-gray-400">100%</span>
                    </div>
                  </div>
                ))}

                <p className="text-sm font-semibold">
                  Total: {totalSelected}%{" "}
                  {totalWarning && (
                    <span className="text-red-500 ml-2 font-medium">⚠ Cannot exceed 100%</span>
                  )}
                </p>

                {/* 🎨 Color Palette */}
                {colors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Palette className="h-5 w-5 text-yellow-500" /> Choose a Color Palette
                    </h3>
                    <div className="flex overflow-x-auto gap-4 py-2 scroll-smooth">
                      <div
                        onClick={() => handleColorClick(null)}
                        className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-full border ${
                          selectedColor === null ? "border-4 border-black" : "border-gray-300"
                        } cursor-pointer bg-white text-xs font-medium`}
                      >
                        None
                      </div>

                      {colors.map((color) => (
                        <div
                          key={color}
                          onClick={() => handleColorClick(color)}
                          className={`flex-shrink-0 rounded-full cursor-pointer transition-transform duration-200 ${
                            selectedColor === color
                              ? "ring-4 ring-black scale-110"
                              : "ring-1 ring-gray-300 hover:scale-105"
                          }`}
                          style={{ backgroundColor: color, width: "40px", height: "40px" }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => runSearch()}
                  disabled={loading}
                  className="w-full mt-4"
                >
                  {loading
                    ? "Searching..."
                    : totalSelected !== 100
                    ? `Search (auto-normalizing ${totalSelected}%)`
                    : "🔍 Search with Selected Filters"}
                </Button>
              </div>
            )}

            {/* Results */}
            {searchResults.length > 0 && (
              <div className="flex flex-col lg:flex-row gap-6">
                {searchImage && (
                  <div className="lg:w-1/4 flex flex-col items-center">
                    <img
                      src={searchImage}
                      alt="Query"
                      className="w-32 h-32 object-cover rounded-md shadow-md"
                    />
                    <p className="text-sm mt-2 text-gray-500">Uploaded Image</p>
                  </div>
                )}
                <div className="lg:w-3/4">
                  <SearchResults
                    results={searchResults}
                    searchImage={searchImage}
                    filters={filters}
                    selectedColor={selectedColor}
                    loading={loading}
                    weights={weights} // ✅ Pass weights
                  />
                </div>
              </div>
            )}
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50">
              <div className="animate-spin h-16 w-16 border-4 border-t-transparent border-white rounded-full"></div>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
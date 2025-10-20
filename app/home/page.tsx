"use client"

import { useState } from "react"
import { ProtectedRoute } from "@/components/protected-route"
import { SearchInterface } from "@/components/search-interface"
import { SearchResults } from "@/components/search-results"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Sparkles, Layers, Palette, Eye } from "lucide-react"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"


export interface SearchResult {
  imageUrl: string
  tags?: string[]
  matchReason?: string
  similarity: number
  score?: number
  id?: number
  filename?: string
  filepath?: string
  message?: string
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
  const [lastFile, setLastFile] = useState<File | null>(null)
  const [totalWarning, setTotalWarning] = useState(false)

  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth-token") : null

  // 🧠 Run Search (single entry point)
  const runSearch = async (file?: File) => {
    if (!token || !lastFile) return

    // Ensure at least one filter is active (kept for future toggles)
    const activeFilters = Object.keys(filters).filter(
      (key) => filters[key as keyof typeof filters]
    )
    if (activeFilters.length === 0) {
      alert("No filters selected. Please enable at least one filter.")
      return
    }

    // Normalize weights to 100%
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

      // Backend expects weights as 0..1 floats
      formData.append("style_weight", String(newWeights.style / 100))
      formData.append("texture_weight", String(newWeights.texture / 100))
      formData.append("color_weight", String(newWeights.color / 100))
      formData.append("emotion_weight", String(newWeights.emotion / 100))
      // We don't send selected_color anymore (palette section removed)

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

  // Handle upload from SearchInterface (preview kept there)
  const handleSearch = async (file: File) => {
    setLastFile(file)
    setSearchImage(URL.createObjectURL(file))
    setSearchResults([])
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

  // Shared icons map (for consistency if needed later)
  const icons: Record<string, JSX.Element> = {
    style: <Sparkles className="h-4 w-4 text-primary" />,
    texture: <Layers className="h-4 w-4 text-green-600" />,
    color: <Palette className="h-4 w-4 text-yellow-600" />,
    emotion: <Eye className="h-4 w-4 text-pink-600" />,
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 container mx-auto px-2 sm:px-4 py-6 sm:py-8 relative">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">🎨 AI Art Search</h1>
              <p className="text-muted-foreground">
                Upload an image, adjust feature weights, and explore visually similar artworks
              </p>
            </div>

            {/* Upload (no search button here; only one main Search button below) */}
            <SearchInterface onSearch={handleSearch} loading={loading} />

            {/* Filters (compact) + Single Search button */}
            {lastFile && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">🎛️ Feature Weights</h3>
                  <p className="text-xs text-gray-500">
                    Total: {totalSelected}%{" "}
                    {totalWarning && (
                      <span className="text-red-500 ml-2 font-medium">⚠ Max 100%</span>
                    )}
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(weights).map(([key, value]) => (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        {/* 🧠 Tooltip around label */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2 text-sm cursor-help">
                            {icons[key]}
                            <label className="capitalize">{key}</label>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          {key === "style" && "The overall artistic movement (e.g., Impressionism, Cubism)."}
                          {key === "texture" && "Surface detail, brushstroke density, or roughness in the image."}
                          {key === "color" && "Dominant hue palette and tone composition of the artwork."}
                          {key === "emotion" && "Mood or emotion expressed visually through color and subject."}
                        </TooltipContent>
                      </Tooltip>

                      <span className="text-xs text-gray-500">{value}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={value}
                        onChange={(e) => updateWeight(key, parseInt(e.target.value, 10))}
                        className="w-full accent-primary"
                      />
                  </div>
                </div>
              ))}
            </div>


                <Button
                  onClick={() => runSearch()}
                  disabled={loading}
                  className="w-full mt-2"
                >
                  {loading
                    ? "Searching..."
                    : totalSelected !== 100
                    ? `Search (auto-normalizing ${totalSelected}%)`
                    : "🔍 Search"}
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
                      className="w-40 h-40 object-cover rounded-md shadow-md"
                    />
                    <p className="text-sm mt-2 text-gray-500">Uploaded Image</p>
                  </div>
                )}

                <div className="lg:w-3/4">
                  <SearchResults
                    results={searchResults}
                    searchImage={searchImage}
                    filters={filters}
                    selectedColor={null}       
                    loading={loading}
                    // weights not shown in results anymore
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

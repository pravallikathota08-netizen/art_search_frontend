"use client"

import React, { useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SearchResult {
  id?: number
  filename?: string
  filepath?: string
  score?: number
  message?: string
  matchReason?: string
  imageUrl?: string
  similarity?: number
}

interface SearchResultsProps {
  results: SearchResult | SearchResult[]
  searchImage: string | null
  filters: {
    style: boolean
    texture: boolean
    colorPalette: boolean
    emotion: boolean
  }
  selectedColor: string | null
  loading: boolean
  weights?: {
    style: number
    texture: number
    colorPalette: number
    emotion: number
  }
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  searchImage,
  filters,
  selectedColor,
  loading,
  weights,
}) => {
  if (loading) return <p className="text-center text-gray-500">🔍 Searching...</p>
  if (!results || (Array.isArray(results) && results.length === 0))
    return <p className="text-center text-gray-400">No matching results found.</p>

  const normalizedResults = Array.isArray(results) ? results : [results]
  const carouselRef = useRef<HTMLDivElement>(null)

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -300, behavior: "smooth" })
  }

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 300, behavior: "smooth" })
  }

  const parseMatchReason = (reason: string | undefined) => {
    if (!reason) return []
    const regex = /(\w+)\s*([\d.]+)?(?:×|x|weight)?\s*(\d+)?%?/gi
    const matches = Array.from(reason.matchAll(regex))
    return matches
      .map((m) => {
        const key = m[1]?.toLowerCase()
        const sim = parseFloat(m[2] || "1")
        const weight = parseInt(m[3] || "0")
        if (!key) return null
        const contribution = Math.round((sim || 1) * (weight || 0))
        return { key, contribution }
      })
      .filter(Boolean)
  }

  const featureOrder = ["style", "texture", "colorpalette", "emotion"]

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  const featureIcons: Record<string, string> = {
    style: "🎨",
    texture: "🧱",
    colorpalette: "🌈",
    emotion: "😊",
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Search Results</h2>
        <p className="text-muted-foreground">
          Found {normalizedResults.length} similar artworks based on:{" "}
          {Object.keys(filters)
            .filter((k) => filters[k as keyof typeof filters])
            .join(", ")}
          {selectedColor && ` and color ${selectedColor}`}
        </p>
      </div>

      {/* Carousel container with arrows */}
      <div className="relative group">
        {/* Left Arrow */}
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/80 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition z-20"
        >
          <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-gray-200" />
        </button>

        {/* Scrollable Carousel */}
        <div
          ref={carouselRef}
          className="flex overflow-x-auto gap-6 pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-400/50 scroll-smooth"
        >
          {normalizedResults.map((r, i) => {
            let features = parseMatchReason(r.matchReason)
            if (features.length === 0 && weights) {
              features = Object.entries(weights).map(([k, v]) => ({
                key: k.toLowerCase(),
                contribution: Math.round(v),
              }))
            }

            const finalScore = r.score
              ? r.score
              : r.similarity
              ? r.similarity * 100
              : 0

            return (
              <Card
                key={i}
                className="min-w-[260px] sm:min-w-[300px] snap-start shrink-0 border rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900"
              >
                <CardContent className="p-4">
                  {/* 🎨 Image */}
                  <img
                    src={r.filepath || r.imageUrl || ""}
                    alt={r.filename || `result-${i}`}
                    className="rounded-lg w-full h-56 object-cover mb-4 shadow-sm"
                  />

                  {/* 🧩 Feature Percentages */}
                  <div className="space-y-3 mb-4">
                    {featureOrder.map((key) => {
                      const f = features.find((x) => x!.key.includes(key))
                      const label =
                        key === "colorpalette"
                          ? "Color Palette"
                          : key.charAt(0).toUpperCase() + key.slice(1)
                      const value = f
                        ? f!.contribution
                        : weights?.[key as keyof typeof weights] || 0

                      return (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between items-center text-base">
                            <span className="font-bold text-gray-900 dark:text-gray-100 tracking-wide flex items-center gap-1">
                              <span>{featureIcons[key]}</span> {label}
                            </span>
                            <span className="font-extrabold text-gray-900 dark:text-gray-50">
                              {value}%
                            </span>
                          </div>
                          <Progress
                            value={value}
                            className={`h-2.5 rounded-full ${
                              key === "style"
                                ? "bg-blue-300"
                                : key === "texture"
                                ? "bg-green-300"
                                : key === "colorpalette"
                                ? "bg-yellow-300"
                                : "bg-pink-300"
                            }`}
                          />
                        </div>
                      )
                    })}
                  </div>

                  {/* 🌟 Match Score */}
                  <div
                    className={`mt-4 text-lg font-extrabold ${scoreColor(
                      finalScore
                    )} tracking-wide text-center`}
                  >
                    Match Score: {finalScore.toFixed(2)}%
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Right Arrow */}
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/80 backdrop-blur-md p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-700 transition z-20"
        >
          <ChevronRight className="h-6 w-6 text-gray-800 dark:text-gray-200" />
        </button>
      </div>
    </div>
  )
}

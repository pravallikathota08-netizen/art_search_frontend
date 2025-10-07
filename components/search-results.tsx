"use client"

import React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

// ✅ Updated type matches backend schema
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
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  searchImage,
  filters,
  selectedColor,
  loading,
}) => {
  if (loading) return <p>🔍 Searching...</p>
  if (!results || (Array.isArray(results) && results.length === 0)) return null

  // Normalize results into an array
  const normalizedResults = Array.isArray(results) ? results : [results]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Search Results</h2>
        <p className="text-muted-foreground">
          Found {normalizedResults.length} similar images using filters:{" "}
          {Object.keys(filters)
            .filter((k) => filters[k as keyof typeof filters])
            .join(", ")}
        </p>
      </div>

      {/* Query Image */}
      {searchImage && (
        <div className="flex flex-col items-center space-y-2">
          <h3 className="text-lg font-medium">Search query</h3>
          <img
            src={searchImage}
            alt="Search query"
            className="w-48 h-48 object-cover rounded-md shadow-md"
          />
          <p className="text-sm text-muted-foreground">
            AI analyzed this image using filters:{" "}
            {Object.keys(filters)
              .filter((k) => filters[k as keyof typeof filters])
              .join(", ")}
            .
          </p>
        </div>
      )}

      {/* ✅ Results */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {normalizedResults.map((r, i) => {
          // Extract breakdown numbers from matchReason
          const parts = (r.matchReason || "")
            .split(", ")
            .map((p) => {
              const match = p.match(/(\w+)\s([\d.]+).*×(\d+)%/)
              if (match) {
                return {
                  key: match[1],
                  value: parseFloat(match[2]),
                  weight: parseInt(match[3]),
                }
              }
              return null
            })
            .filter(Boolean)

          // Render result card
          return (
            <Card key={i} className="overflow-hidden border rounded-xl shadow-sm">
              <CardContent className="p-4">
                <img
                  src={r.filepath || r.imageUrl || ""}
                  alt={r.filename || `result-${i}`}
                  className="rounded-lg w-full h-60 object-cover mb-3"
                />
                <div className="font-semibold text-gray-700">
                  Score:{" "}
                  {r.score
                    ? r.score.toFixed(2)
                    : r.similarity
                    ? (r.similarity * 100).toFixed(2)
                    : "N/A"}
                  %
                </div>
                <div className="text-sm text-gray-500">
                  {r.message || r.matchReason || "No details"}
                </div>

                {/* Breakdown visualization */}
                {parts.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm text-gray-500">Match breakdown:</p>
                    {parts.map((p) => (
                      <div key={p!.key} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="capitalize">{p!.key}</span>
                          <span>
                            {(p!.value * 100).toFixed(0)}% (×{p!.weight}%)
                          </span>
                        </div>
                        <Progress
                          value={p!.value * 100}
                          className={
                            p!.key === "Style"
                              ? "bg-blue-200"
                              : p!.key === "Texture"
                              ? "bg-green-200"
                              : p!.key === "Palette"
                              ? "bg-yellow-200"
                              : "bg-pink-200"
                          }
                        />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

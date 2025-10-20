"use client"

import React, { useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

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
    color: boolean
    emotion: boolean
  }
  selectedColor: string | null
  loading: boolean
  weights?: {
    style: number
    texture: number
    color: number
    emotion: number
  }
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  filters,
  selectedColor,
  loading,
}) => {
  if (loading) return <p className="text-center text-gray-500">🔍 Searching...</p>
  if (!results || (Array.isArray(results) && results.length === 0))
    return <p className="text-center text-gray-400">No matching results found.</p>

  const normalizedResults = Array.isArray(results) ? results : [results]
  const carouselRef = useRef<HTMLDivElement>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const scrollLeft = () => {
    carouselRef.current?.scrollBy({ left: -400, behavior: "smooth" })
  }

  const scrollRight = () => {
    carouselRef.current?.scrollBy({ left: 400, behavior: "smooth" })
  }

  const scoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 50) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-semibold">Search Results</h2>
        <p className="text-muted-foreground text-sm">
          Showing {normalizedResults.length} matches based on your selected features
          {selectedColor ? ` and color ${selectedColor}` : ""}.
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
            const finalScore = r.score
              ? r.score
              : r.similarity
              ? r.similarity * 100
              : 0

            return (
              <Card
                key={i}
                className="min-w-[300px] sm:min-w-[360px] snap-start shrink-0 border rounded-xl shadow-md hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-900"
              >
                <CardContent className="p-4">
                  {/* Click-to-enlarge via Dialog */}
                  <Dialog open={openIndex === i} onOpenChange={(open) => setOpenIndex(open ? i : null)}>
                    <DialogTrigger asChild>
                      <img
                        src={r.filepath || r.imageUrl || ""}
                        alt={r.filename || `result-${i}`}
                        className="rounded-lg w-full h-[320px] sm:h-[380px] object-cover mb-4 shadow-sm cursor-zoom-in"
                        onClick={() => setOpenIndex(i)}
                      />
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl p-0 bg-transparent border-none shadow-none">
                      <img
                        src={r.filepath || r.imageUrl || ""}
                        alt={r.filename || `result-large-${i}`}
                        className="w-full h-auto rounded-lg object-contain"
                      />
                    </DialogContent>
                  </Dialog>

                  {/* Overall Similarity Only */}
                  <div className="mt-2 text-center">
                    <div
                      className={`text-lg font-extrabold ${scoreColor(
                        finalScore
                      )} tracking-wide`}
                    >
                      Similarity: {finalScore.toFixed(2)}%
                    </div>
                    {r.filename && (
                      <div className="mt-1 text-xs text-gray-500 truncate">
                        {r.filename}
                      </div>
                    )}
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

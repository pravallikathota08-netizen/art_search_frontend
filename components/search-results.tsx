"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { SearchResult } from "@/app/home/page"

interface SearchResultsProps {
  results: SearchResult[]
  searchImage: string | null
  loading: boolean
}

export function SearchResults({ results, searchImage, loading }: SearchResultsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Searching...</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 glass-effect border-border/50">
              <div className="animate-pulse space-y-4">
                <div className="aspect-square bg-muted rounded-lg"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Search Results</h2>
        <p className="text-muted-foreground">Found {results.length} similar images</p>
      </div>

      {/* Original uploaded image */}
      {searchImage && (
        <Card className="p-6 glass-effect border-border/50">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="flex-shrink-0">
              <img
                src={searchImage}
                alt="Search query"
                className="w-32 h-32 object-cover rounded-lg border border-border/50"
              />
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Your Search Image</h3>
              <p className="text-muted-foreground">
                AI is analyzing this image to find artworks with a similar color palette.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, i) => (
          <Card key={i} className="p-4 glass-effect border-border/50 hover:border-primary/50 transition-colors">
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <img
                  src={result.imageUrl || "/placeholder.svg"}
                  alt="Similar artwork"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="glass-effect">
                    {Math.round(result.similarity * 100)}% match
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap gap-1">
                  {result.tags.map((tag, t) => (
                    <Badge key={t} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium text-sm mb-1">Why this matched:</h4>
                  <p className="text-sm text-muted-foreground">{result.matchReason}</p>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

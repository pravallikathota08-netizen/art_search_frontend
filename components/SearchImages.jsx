"use client"; // required for Next.js App Router client components
import React, { useState } from "react";

export default function SearchImages() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState([]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSearch = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/search?top_n=5", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to fetch results");
      }

      const data = await response.json();
      setResults(data.matches);
    } catch (err) {
      console.error(err);
      alert("Error searching images. Check backend server.");
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Image Search (Color Palette)</h2>

      {/* Upload */}
      <div className="flex items-center gap-2 mb-4">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="border p-2 rounded"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
        >
          Search
        </button>
      </div>

      {/* Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map(([path, score], i) => (
          <div key={i} className="border rounded shadow p-2">
            <p className="text-sm font-semibold">Match {i + 1}</p>
            <p className="text-xs text-gray-600 mb-2">
              Similarity Score: {score.toFixed(2)}
            </p>
            <img
              src={`http://localhost:8000/${path}`}
              alt={`Match ${i + 1}`}
              className="w-full h-48 object-contain rounded"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

"use client"

import Image from "next/image"

export function BrandLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="relative">
        <Image
          src="/brand.png"
          alt="Brand Logo"
          width={120}
          height={120}
          className="animate-pulse"
          priority
        />
      </div>
    </div>
  )
}

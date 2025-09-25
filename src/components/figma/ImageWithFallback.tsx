import React, { useEffect, useState } from 'react'
import { SupabaseImageStorage, USE_SIGNED_URLS } from '../../lib/supabase-storage'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

export function ImageWithFallback(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const [didError, setDidError] = useState(false)
  const [resolvedSrc, setResolvedSrc] = useState<string | undefined>(undefined)

  const handleError = () => {
    setDidError(true)
  }

  const { src, alt, style, className, ...rest } = props

  // Resolve Supabase storage path to public or signed URL
  useEffect(() => {
    let cancelled = false
    async function run() {
      if (!src) { setResolvedSrc(undefined); return }
      if (typeof src !== 'string' || src.startsWith('http') || src.startsWith('data:')) {
        setResolvedSrc(src as string)
        return
      }
      if (USE_SIGNED_URLS) {
        const url = await SupabaseImageStorage.getSignedImageUrl(src)
        if (!cancelled) setResolvedSrc(url || '')
      } else {
        if (!cancelled) setResolvedSrc(SupabaseImageStorage.getImageUrl(src))
      }
    }
    run()
    return () => { cancelled = true }
  }, [src])

  const imageUrl = resolvedSrc

  return didError ? (
    <div
      className={`inline-block bg-gray-800 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={imageUrl} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}

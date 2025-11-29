export type GalleryMediaType = 'image' | 'video' | 'audio' | 'cd'

export type GalleryMedia = {
  id: string
  mediaType: GalleryMediaType
  src: string
  title: string
  description?: string
  orientation: 'portrait' | 'landscape' | 'square'
  caption?: string
  date?: string
  poster?: string
  // Audio/CD specific fields
  duration?: string
  artist?: string
  album?: string
  trackNumber?: number
  coverArt?: string
}

export type GalleryCollection = {
  id: string
  title: string
  description: string
  mediaType?: GalleryMediaType
  items: GalleryMedia[]
}

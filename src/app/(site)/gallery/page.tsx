'use client'

import Image from 'next/image'
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, Play, Pause, Search, Camera, Video,
  ChevronLeft, ChevronRight, Volume2, VolumeX,
  ImageIcon, Film, Disc3, Headphones, SkipBack, SkipForward,
  Clock, User, Music, ExternalLink
} from 'lucide-react'

import { galleryCollections, galleryVideos, galleryHighlights, galleryAudio, galleryCDs } from '@/app/data/gallery'
import type { GalleryMedia } from '@/app/types/gallery'

// Combine all images for the photos gallery
const allPhotos = [
  ...galleryHighlights,
  ...galleryCollections.flatMap(c => c.items),
]

type TabType = 'photos' | 'videos' | 'audio' | 'cds'

const GalleryPage = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryMedia | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [activeTab, setActiveTab] = useState<TabType>('photos')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentAudio, setCurrentAudio] = useState<GalleryMedia | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioProgress, setAudioProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleImageSelect = (image: GalleryMedia, index: number) => {
    setSelectedImage(image)
    setSelectedIndex(index)
  }

  const handlePrevious = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : allPhotos.length - 1
    setSelectedIndex(newIndex)
    setSelectedImage(allPhotos[newIndex])
  }

  const handleNext = () => {
    const newIndex = selectedIndex < allPhotos.length - 1 ? selectedIndex + 1 : 0
    setSelectedIndex(newIndex)
    setSelectedImage(allPhotos[newIndex])
  }

  // Audio player controls
  const handleAudioPlay = (audio: GalleryMedia) => {
    if (currentAudio?.id === audio.id) {
      if (isPlaying) {
        audioRef.current?.pause()
        setIsPlaying(false)
      } else {
        audioRef.current?.play()
        setIsPlaying(true)
      }
    } else {
      setCurrentAudio(audio)
      setIsPlaying(true)
      setAudioProgress(0)
    }
  }

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Filter items based on search
  const filteredPhotos = searchQuery
    ? allPhotos.filter(img => 
        img.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        img.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allPhotos

  const filteredVideos = searchQuery
    ? galleryVideos.filter(v => 
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : galleryVideos

  const filteredAudio = searchQuery
    ? galleryAudio.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.artist?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : galleryAudio

  const filteredCDs = searchQuery
    ? galleryCDs.filter(cd => 
        cd.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cd.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cd.artist?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : galleryCDs

  const tabs = [
    { id: 'photos' as TabType, label: 'Photos', icon: ImageIcon, count: allPhotos.length },
    { id: 'videos' as TabType, label: 'Videos', icon: Film, count: galleryVideos.length },
    { id: 'audio' as TabType, label: 'Audio', icon: Headphones, count: galleryAudio.length },
    { id: 'cds' as TabType, label: 'CDs', icon: Disc3, count: galleryCDs.length },
  ]

  return (
    <main className='min-h-screen bg-stone-50'>
      {/* Hero Section - Elegant Warm Design */}
      <section className='relative pt-32 pb-20 bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900 overflow-hidden'>
        {/* Background texture */}
        <div className='absolute inset-0 opacity-20' style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />
        <div className='absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-amber-500/5 to-transparent' />
        <div className='absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-orange-500/5 to-transparent' />
        
        <div className='container mx-auto max-w-6xl px-4 relative'>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className='text-center'
          >
            <span className='inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 backdrop-blur-sm rounded-full text-amber-200/90 text-sm font-medium mb-6 border border-amber-500/20'>
              <Camera className='w-4 h-4' />
              Media Gallery
            </span>
            <h1 className='text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight tracking-tight'>
              Sacred Moments
              <span className='block text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300'>
                & Memories
              </span>
            </h1>
            <p className='text-lg text-stone-300 max-w-2xl mx-auto leading-relaxed mb-12'>
              Explore our collection of photos, videos, audio recordings, and music from 
              Divine Mercy Retreat Center's transformative gatherings.
            </p>

            {/* Stats */}
            <div className='flex flex-wrap items-center justify-center gap-6 md:gap-10'>
              {tabs.map((tab) => (
                <motion.div 
                  key={tab.id}
                  whileHover={{ scale: 1.05 }}
                  className='text-center cursor-pointer group'
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-2 transition-all ${
                    activeTab === tab.id 
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' 
                      : 'bg-white/10 text-white/70 group-hover:bg-white/20'
                  }`}>
                    <tab.icon className='w-6 h-6' />
                  </div>
                  <p className='text-2xl font-bold text-white'>{tab.count}</p>
                  <p className='text-sm text-stone-400'>{tab.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Filter Bar */}
      <div className='sticky top-[88px] z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-sm'>
        <div className='container mx-auto max-w-6xl px-4'>
          <div className='flex items-center justify-between py-4 gap-4 flex-wrap'>
            {/* Tabs */}
            <div className='flex items-center bg-stone-100 rounded-2xl p-1.5 gap-1'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-stone-900 shadow-sm'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  <tab.icon className='w-4 h-4' />
                  <span className='hidden sm:inline'>{tab.label}</span>
                  <span className='text-xs text-stone-400'>({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className='relative flex-1 max-w-md'>
              <Search className='absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400' />
              <input
                type='text'
                placeholder='Search gallery...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='w-full pl-12 pr-4 py-3 bg-stone-100 border-0 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all'
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className='container mx-auto max-w-6xl px-4 py-12'>
        <AnimatePresence mode='wait'>
          {/* Photos Tab */}
          {activeTab === 'photos' && (
            <motion.div
              key='photos'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-stone-900'>Photo Gallery</h2>
                <p className='text-stone-600 mt-1'>
                  {filteredPhotos.length} photos from retreats, missions, and community gatherings
                </p>
              </div>

              {/* Masonry Grid */}
              <div className='columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4'>
                {filteredPhotos.map((item, index) => {
                  const heights = ['aspect-[3/4]', 'aspect-square', 'aspect-[4/5]', 'aspect-[3/5]', 'aspect-[4/3]', 'aspect-[3/4]']
                  const heightClass = heights[index % heights.length]

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: (index % 8) * 0.05 }}
                      className='break-inside-avoid mb-4'
                    >
                      <div
                        className={`group relative ${heightClass} rounded-2xl overflow-hidden cursor-pointer bg-stone-200`}
                        onClick={() => handleImageSelect(item, index)}
                      >
                        <Image
                          src={item.src}
                          alt={item.title}
                          fill
                          className='object-cover transition-all duration-700 group-hover:scale-110'
                        />
                        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300' />
                        
                        {/* Hover expand icon */}
                        <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300'>
                          <div className='w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-xl'>
                            <ImageIcon className='w-5 h-5 text-stone-800' />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </div>

              {filteredPhotos.length === 0 && (
                <EmptyState icon={ImageIcon} message='No photos found' />
              )}
            </motion.div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <motion.div
              key='videos'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-stone-900'>Video Gallery</h2>
                <p className='text-stone-600 mt-1'>
                  Watch testimonies, highlights, and recordings from DMRC
                </p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {filteredVideos.map((video, index) => (
                  <motion.article
                    key={video.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                    className='group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300'
                  >
                    <div className='relative aspect-video bg-stone-900 overflow-hidden'>
                      <video
                        src={video.src}
                        poster={video.poster}
                        controls
                        playsInline
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute inset-0 flex items-center justify-center pointer-events-none opacity-100 group-hover:opacity-0 transition-opacity duration-300'>
                        <div className='p-5 bg-amber-500 rounded-full shadow-2xl shadow-amber-500/30'>
                          <Play className='w-8 h-8 text-white fill-current ml-1' />
                        </div>
                      </div>
                    </div>
                    <div className='p-6'>
                      <h3 className='font-bold text-lg text-stone-900 mb-2 group-hover:text-amber-600 transition-colors'>
                        {video.title}
                      </h3>
                      {video.description && (
                        <p className='text-stone-600 text-sm line-clamp-2'>{video.description}</p>
                      )}
                    </div>
                  </motion.article>
                ))}
              </div>

              {filteredVideos.length === 0 && (
                <EmptyState icon={Film} message='No videos found' />
              )}
            </motion.div>
          )}

          {/* Audio Tab */}
          {activeTab === 'audio' && (
            <motion.div
              key='audio'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-stone-900'>Audio Library</h2>
                <p className='text-stone-600 mt-1'>
                  Homilies, testimonies, and worship recordings
                </p>
              </div>

              <div className='space-y-4'>
                {filteredAudio.map((audio, index) => (
                  <motion.div
                    key={audio.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className={`group bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                      currentAudio?.id === audio.id 
                        ? 'border-amber-300 shadow-lg shadow-amber-500/10' 
                        : 'border-stone-100 hover:border-stone-200 hover:shadow-md'
                    }`}
                  >
                    <div className='flex items-center gap-4 p-4'>
                      {/* Cover Art */}
                      <div className='relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-amber-100 to-orange-100'>
                        {audio.coverArt ? (
                          <Image src={audio.coverArt} alt={audio.title} fill className='object-cover' />
                        ) : (
                          <div className='w-full h-full flex items-center justify-center'>
                            <Music className='w-8 h-8 text-amber-500' />
                          </div>
                        )}
                        
                        {/* Play button overlay */}
                        <button
                          onClick={() => handleAudioPlay(audio)}
                          className='absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/30 transition-colors'
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                            currentAudio?.id === audio.id && isPlaying
                              ? 'bg-amber-500 text-white'
                              : 'bg-white/90 text-stone-800 opacity-0 group-hover:opacity-100'
                          }`}>
                            {currentAudio?.id === audio.id && isPlaying ? (
                              <Pause className='w-4 h-4' />
                            ) : (
                              <Play className='w-4 h-4 ml-0.5' />
                            )}
                          </div>
                        </button>
                      </div>

                      {/* Info */}
                      <div className='flex-1 min-w-0'>
                        <h3 className='font-semibold text-stone-900 truncate group-hover:text-amber-600 transition-colors'>
                          {audio.title}
                        </h3>
                        <div className='flex items-center gap-3 mt-1 text-sm text-stone-500'>
                          {audio.artist && (
                            <span className='flex items-center gap-1'>
                              <User className='w-3.5 h-3.5' />
                              {audio.artist}
                            </span>
                          )}
                          {audio.duration && (
                            <span className='flex items-center gap-1'>
                              <Clock className='w-3.5 h-3.5' />
                              {audio.duration}
                            </span>
                          )}
                        </div>
                        {audio.description && (
                          <p className='text-sm text-stone-500 mt-2 line-clamp-1'>{audio.description}</p>
                        )}
                      </div>

                      {/* Play button (desktop) */}
                      <button
                        onClick={() => handleAudioPlay(audio)}
                        className={`hidden md:flex w-12 h-12 rounded-full items-center justify-center flex-shrink-0 transition-all ${
                          currentAudio?.id === audio.id && isPlaying
                            ? 'bg-amber-500 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-amber-500 hover:text-white'
                        }`}
                      >
                        {currentAudio?.id === audio.id && isPlaying ? (
                          <Pause className='w-5 h-5' />
                        ) : (
                          <Play className='w-5 h-5 ml-0.5' />
                        )}
                      </button>
                    </div>

                    {/* Progress bar when playing */}
                    {currentAudio?.id === audio.id && (
                      <div className='h-1 bg-stone-100'>
                        <div 
                          className='h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-200'
                          style={{ width: `${audioProgress}%` }}
                        />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {filteredAudio.length === 0 && (
                <EmptyState icon={Headphones} message='No audio found' />
              )}

              {/* Hidden audio element */}
              {currentAudio && (
                <audio
                  ref={audioRef}
                  src={currentAudio.src}
                  autoPlay={isPlaying}
                  onTimeUpdate={(e) => {
                    const audio = e.target as HTMLAudioElement
                    setAudioProgress((audio.currentTime / audio.duration) * 100)
                  }}
                  onEnded={() => {
                    setIsPlaying(false)
                    setAudioProgress(0)
                  }}
                />
              )}
            </motion.div>
          )}

          {/* CDs Tab */}
          {activeTab === 'cds' && (
            <motion.div
              key='cds'
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className='mb-8'>
                <h2 className='text-2xl font-bold text-stone-900'>CD Collection</h2>
                <p className='text-stone-600 mt-1'>
                  Original music and prayer recordings available from DMRC
                </p>
              </div>

              <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
                {filteredCDs.map((cd, index) => (
                  <motion.div
                    key={cd.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className='group bg-white rounded-3xl overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-300'
                  >
                    {/* CD Cover */}
                    <div className='relative aspect-square bg-gradient-to-br from-stone-100 to-stone-200 overflow-hidden'>
                      {cd.coverArt ? (
                        <Image src={cd.coverArt} alt={cd.title} fill className='object-cover transition-transform duration-500 group-hover:scale-105' />
                      ) : (
                        <div className='w-full h-full flex items-center justify-center'>
                          <Disc3 className='w-20 h-20 text-stone-300' />
                        </div>
                      )}
                      
                      {/* Vinyl effect overlay */}
                      <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/40'>
                        <div className='w-24 h-24 rounded-full bg-stone-900 flex items-center justify-center shadow-2xl animate-spin-slow'>
                          <div className='w-8 h-8 rounded-full bg-amber-500' />
                        </div>
                      </div>
                    </div>

                    {/* CD Info */}
                    <div className='p-5'>
                      <h3 className='font-bold text-stone-900 mb-1 group-hover:text-amber-600 transition-colors line-clamp-1'>
                        {cd.title}
                      </h3>
                      {cd.artist && (
                        <p className='text-sm text-stone-500 mb-3 flex items-center gap-1.5'>
                          <User className='w-3.5 h-3.5' />
                          {cd.artist}
                        </p>
                      )}
                      {cd.description && (
                        <p className='text-sm text-stone-600 line-clamp-2 mb-4'>{cd.description}</p>
                      )}
                      
                      <a
                        href={cd.src}
                        className='inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors'
                      >
                        View Details
                        <ExternalLink className='w-3.5 h-3.5' />
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>

              {filteredCDs.length === 0 && (
                <EmptyState icon={Disc3} message='No CDs found' />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Photo Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-sm'
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className='absolute top-6 right-6 z-10 p-3 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors'
            >
              <X className='w-6 h-6' />
            </button>

            <button
              onClick={(e) => { e.stopPropagation(); handlePrevious() }}
              className='absolute left-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors'
            >
              <ChevronLeft className='w-6 h-6' />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleNext() }}
              className='absolute right-4 top-1/2 -translate-y-1/2 z-10 p-4 bg-white/10 backdrop-blur-sm rounded-full text-white hover:bg-white/20 transition-colors'
            >
              <ChevronRight className='w-6 h-6' />
            </button>

            <div className='h-full flex items-center justify-center p-6 sm:p-12'>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className='relative max-w-6xl w-full'
                onClick={(e) => e.stopPropagation()}
              >
                <div className='relative'>
                  <Image
                    src={selectedImage.src}
                    alt={selectedImage.title}
                    width={1400}
                    height={900}
                    className='w-full h-auto max-h-[75vh] object-contain rounded-2xl'
                  />
                </div>

                <div className='mt-6 flex items-start justify-between gap-4'>
                  <div>
                    <h3 className='text-2xl font-bold text-white mb-2'>{selectedImage.title}</h3>
                    {selectedImage.description && (
                      <p className='text-white/70 max-w-2xl'>{selectedImage.description}</p>
                    )}
                  </div>
                </div>

                <div className='absolute top-4 left-4 px-4 py-2 bg-stone-900/80 backdrop-blur-sm rounded-full text-white text-sm font-medium'>
                  {selectedIndex + 1} / {allPhotos.length}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Audio Player */}
      <AnimatePresence>
        {currentAudio && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className='fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-md mx-auto px-4'
          >
            <div className='bg-stone-900 rounded-2xl shadow-2xl p-4 flex items-center gap-4'>
              {/* Cover */}
              <div className='relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-stone-800'>
                {currentAudio.coverArt ? (
                  <Image src={currentAudio.coverArt} alt={currentAudio.title} fill className='object-cover' />
                ) : (
                  <div className='w-full h-full flex items-center justify-center'>
                    <Music className='w-6 h-6 text-stone-600' />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className='flex-1 min-w-0'>
                <p className='text-white font-medium truncate text-sm'>{currentAudio.title}</p>
                <p className='text-stone-400 text-xs truncate'>{currentAudio.artist}</p>
                <div className='mt-1.5 h-1 bg-stone-700 rounded-full overflow-hidden'>
                  <div 
                    className='h-full bg-gradient-to-r from-amber-400 to-orange-500'
                    style={{ width: `${audioProgress}%` }}
                  />
                </div>
              </div>

              {/* Controls */}
              <div className='flex items-center gap-2'>
                <button
                  onClick={toggleMute}
                  className='p-2 text-stone-400 hover:text-white transition-colors'
                >
                  {isMuted ? <VolumeX className='w-5 h-5' /> : <Volume2 className='w-5 h-5' />}
                </button>
                <button
                  onClick={() => handleAudioPlay(currentAudio)}
                  className='w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center hover:bg-amber-400 transition-colors'
                >
                  {isPlaying ? <Pause className='w-5 h-5' /> : <Play className='w-5 h-5 ml-0.5' />}
                </button>
                <button
                  onClick={() => {
                    setCurrentAudio(null)
                    setIsPlaying(false)
                    setAudioProgress(0)
                  }}
                  className='p-2 text-stone-400 hover:text-white transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </main>
  )
}

const EmptyState = ({ icon: Icon, message }: { icon: any; message: string }) => (
  <div className='text-center py-20'>
    <div className='w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4'>
      <Icon className='w-8 h-8 text-stone-400' />
    </div>
    <h3 className='text-lg font-semibold text-stone-900 mb-2'>{message}</h3>
    <p className='text-stone-500'>Try a different search term</p>
  </div>
)

export default GalleryPage

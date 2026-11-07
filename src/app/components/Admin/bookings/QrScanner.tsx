'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, Loader2 } from 'lucide-react'

import { Button } from '@/app/components/ui/button'

type Detector = { detect: (source: CanvasImageSource) => Promise<Array<{ rawValue: string }>> }

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => Detector
  }
}

/**
 * Reads QR codes from the device camera. Uses the browser's built-in
 * BarcodeDetector where available (Chrome, Android) and falls back to jsQR
 * (Safari, Firefox). Calls `onScan` once per code, ignoring repeats of the
 * same code for a few seconds so a ticket held in view isn't scanned twice.
 */
export function QrScanner({ onScan, paused = false }: { onScan: (code: string) => void; paused?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastRef = useRef<{ code: string; at: number }>({ code: '', at: 0 })
  const pausedRef = useRef(paused)
  const onScanRef = useRef(onScan)
  const [state, setState] = useState<'idle' | 'starting' | 'running' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    pausedRef.current = paused
    onScanRef.current = onScan
  }, [paused, onScan])

  const stop = useCallback(() => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current)
    frameRef.current = null
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setState('idle')
  }, [])

  useEffect(() => stop, [stop])

  const start = async () => {
    setError(null)
    setState('starting')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('This browser cannot use the camera. Type the ticket code instead.')
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      streamRef.current = stream
      const video = videoRef.current!
      video.srcObject = stream
      await video.play()

      let detector: Detector | null = null
      if (window.BarcodeDetector) {
        try {
          detector = new window.BarcodeDetector({ formats: ['qr_code'] })
        } catch {
          detector = null
        }
      }
      const jsQR = detector ? null : (await import('jsqr')).default
      canvasRef.current ??= document.createElement('canvas')
      const context = canvasRef.current.getContext('2d', { willReadFrequently: true })
      let lastRun = 0
      setState('running')

      const tick = async (time: number) => {
        frameRef.current = requestAnimationFrame(tick)
        if (time - lastRun < 180 || pausedRef.current || video.readyState < 2) return
        lastRun = time
        let value: string | undefined
        if (detector) {
          const codes = await detector.detect(video).catch(() => [])
          value = codes[0]?.rawValue
        } else if (jsQR && context) {
          const width = Math.min(video.videoWidth, 720)
          const height = Math.round((video.videoHeight / video.videoWidth) * width)
          canvasRef.current!.width = width
          canvasRef.current!.height = height
          context.drawImage(video, 0, 0, width, height)
          const image = context.getImageData(0, 0, width, height)
          value = jsQR(image.data, width, height, { inversionAttempts: 'dontInvert' })?.data
        }
        if (!value) return
        const now = Date.now()
        if (value === lastRef.current.code && now - lastRef.current.at < 4000) return
        lastRef.current = { code: value, at: now }
        onScanRef.current(value)
      }
      frameRef.current = requestAnimationFrame(tick)
    } catch (err) {
      stop()
      const message =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission was denied. Allow camera access in the browser settings, or type the code.'
          : err instanceof Error
            ? err.message
            : 'Could not start the camera.'
      setError(message)
      setState('error')
    }
  }

  return (
    <div>
      <div className='relative aspect-[4/3] overflow-hidden rounded-xl bg-navy-950'>
        <video ref={videoRef} playsInline muted className={state === 'running' ? 'h-full w-full object-cover' : 'hidden'} />
        {state === 'running' && (
          <div aria-hidden className='pointer-events-none absolute inset-0 flex items-center justify-center'>
            <div className='h-3/5 w-3/5 max-w-64 rounded-2xl border-2 border-gold-300/90 shadow-[0_0_0_9999px_rgba(10,20,38,0.45)]' />
          </div>
        )}
        {state !== 'running' && (
          <div className='absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center'>
            {state === 'starting' ? <Loader2 className='h-8 w-8 animate-spin text-gold-300' /> : <Camera className='h-10 w-10 text-gold-300' />}
            <p className='max-w-xs text-sm text-navy-200'>{error ?? 'Point the camera at the QR code on the guest’s ticket or phone.'}</p>
            <Button variant='gold' onClick={start} disabled={state === 'starting'}>
              Start camera
            </Button>
          </div>
        )}
      </div>
      {state === 'running' && (
        <Button variant='outline' size='sm' onClick={stop} className='mt-3 gap-2'>
          <CameraOff className='h-4 w-4' /> Stop camera
        </Button>
      )}
    </div>
  )
}

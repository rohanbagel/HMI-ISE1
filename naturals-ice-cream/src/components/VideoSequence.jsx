import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TOTAL_FRAMES = 120
const FRAME_PATH   = (n) => `/frames/frame_${String(n).padStart(4, '0')}.jpg`

/** Scene boundary snap points (progress 0–1) */
const SNAP_POINTS = [0, 0.333, 0.666, 1]

/* ---------- Static JSX hoisted outside component ---------- */
const gradientOverlay = (
  <div className="absolute inset-0 bg-linear-to-t from-black/65 via-black/5 to-black/25 pointer-events-none" />
)

const grainOverlay = (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.04] mix-blend-overlay"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '128px 128px',
    }}
  />
)

// Init-once guard
let gsapRegistered = false

export default function VideoSequence({ onProgress, onLoaded }) {
  const containerRef    = useRef(null)
  const canvasRef       = useRef(null)
  const framesRef       = useRef([])     // Preloaded Image objects
  const progressRef     = useRef(0)
  const lastFrameRef    = useRef(-1)     // Avoid redrawing same frame
  const lastProgressRef = useRef(-1)     // Throttle idle frames
  const rafRef          = useRef(null)
  const barRef          = useRef(null)

  const [loadedCount, setLoadedCount] = useState(0)
  const [allLoaded,   setAllLoaded]   = useState(false)

  // Register GSAP once
  useEffect(() => {
    if (gsapRegistered) return
    gsapRegistered = true
    gsap.registerPlugin(ScrollTrigger)
  }, [])

  // Preload all frames in parallel
  useEffect(() => {
    const images = Array.from({ length: TOTAL_FRAMES }, (_, i) => {
      const img = new Image()
      img.src = FRAME_PATH(i + 1)
      return img
    })

    framesRef.current = images

    let loaded = 0
    images.forEach((img) => {
      const done = () => {
        loaded++
        setLoadedCount(loaded)
        if (loaded === TOTAL_FRAMES) {
          setAllLoaded(true)
          onLoaded?.()
        }
      }
      if (img.complete) done()
      else { img.onload = done; img.onerror = done }
    })

    return () => {
      images.forEach((img) => { img.onload = null; img.onerror = null })
    }
  }, [onLoaded])

  // ScrollTrigger + rAF canvas draw — runs after all frames loaded
  useEffect(() => {
    if (!allLoaded) return

    const container = containerRef.current
    if (!container) return

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: container,
        start:   'top top',
        end:     '+=4500',
        pin:     true,
        scrub:   0.5,
        snap: {
          snapTo:   SNAP_POINTS,
          duration: { min: 0.3, max: 0.7 },
          delay:    0.05,
          ease:     'power2.inOut',
        },
        onUpdate: (self) => {
          progressRef.current = self.progress
          onProgress?.(self.progress)
        },
      })
    }, container)

    /**
     * rAF loop — canvas flipbook renderer.
     *  • Throttled: skips all work when progress hasn't moved
     *  • Index guard: skips drawImage when frame didn't change
     *  • drawImage is a GPU-accelerated blit — no video decoder, no seek stall
     */
    const draw = () => {
      const p = progressRef.current

      if (Math.abs(p - lastProgressRef.current) > 0.0004) {
        lastProgressRef.current = p

        const idx = Math.min(Math.round(p * (TOTAL_FRAMES - 1)), TOTAL_FRAMES - 1)

        if (idx !== lastFrameRef.current) {
          lastFrameRef.current = idx
          const canvas = canvasRef.current
          const img    = framesRef.current[idx]
          if (canvas && img?.complete) {
            const ctx2d = canvas.getContext('2d')
            ctx2d.drawImage(img, 0, 0, canvas.width, canvas.height)
          }
        }

        if (barRef.current) {
          barRef.current.style.transform = `scaleX(${p})`
        }
      }

      rafRef.current = requestAnimationFrame(draw)
    }

    // Paint frame 0 immediately so canvas isn't blank on load
    const canvas = canvasRef.current
    const first  = framesRef.current[0]
    if (canvas && first?.complete) {
      canvas.getContext('2d').drawImage(first, 0, 0, canvas.width, canvas.height)
    }

    rafRef.current = requestAnimationFrame(draw)

    return () => {
      ctx.revert()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [allLoaded, onProgress])

  const pct = Math.round((loadedCount / TOTAL_FRAMES) * 100)

  return (
    <>
      {/* ─── Loading Screen ─── */}
      {!allLoaded ? (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream">
          <div className="relative mb-10">
            <div className="w-20 h-20 rounded-full border-[3px] border-cream-dark border-t-green animate-churn" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-green font-serif text-lg">N</span>
            </div>
          </div>
          <p className="font-serif text-3xl text-green mb-2 tracking-wide">
            Churning the Cream…
          </p>
          <p className="text-brown-warm text-sm font-light mb-8 tracking-widest uppercase">
            Loading {loadedCount} / {TOTAL_FRAMES} frames
          </p>
          <div className="w-56 h-0.5 bg-cream-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-green rounded-full transition-all duration-300 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="text-brown-warm/60 text-xs mt-3 font-light tabular-nums">
            {pct}%
          </p>
        </div>
      ) : null}

      {/* ─── Sticky Canvas Container ─── */}
      <div
        ref={containerRef}
        className="relative w-full h-screen overflow-hidden bg-black-soft"
      >
        {/* Canvas — rAF loop blits frames here */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />

        {gradientOverlay}
        {grainOverlay}

        {/* Scroll progress ribbon */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.08)' }}
        >
          <div
            ref={barRef}
            className="h-full origin-left will-change-transform"
            style={{ backgroundColor: 'rgba(255,255,255,0.45)', transform: 'scaleX(0)' }}
          />
        </div>
      </div>
    </>
  )
}



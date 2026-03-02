import { useRef, useState, useCallback, useEffect } from 'react'
import VideoSequence from '../components/VideoSequence'
import ScrollOverlayText from '../components/ScrollOverlayText'
import StorySection from '../components/StorySection'
import FlavorCarousel from '../components/FlavorCarousel'
import FindStoreFooter from '../components/FindStoreFooter'

/**
 * Home — Main scrollytelling landing page
 *
 * Architecture:
 *  1. Sticky hero → VideoSequence (pinned) + ScrollOverlayText (fixed overlay)
 *  2. After ScrollTrigger releases pin → standard vertical flow
 *  3. StorySection → FlavorCarousel → FindStoreFooter
 *
 * Performance (Vercel React Best Practices):
 *  • progressRef: shared mutable ref — VideoSequence writes, ScrollOverlayText reads.
 *    No useState for scroll position → zero re-renders during scroll.
 *    (rerender-use-ref-transient-values)
 *  • Scroll indicator DOM is toggled via ref, not state
 *  • useCallback with stable deps (rerender-functional-setstate)
 */
export default function Home() {
  // Mutable ref for scroll progress — shared between video & text overlay
  const progressRef = useRef(0)
  const scrollIndicatorRef = useRef(null)
  const indicatorHiddenRef = useRef(false)

  const [videosLoaded, setVideosLoaded] = useState(false)

  /**
   * VideoSequence calls this on every scroll tick.
   * We write to the ref (not state) to avoid re-renders.
   * Also hide the scroll indicator once user starts scrolling.
   */
  const handleProgress = useCallback((p) => {
    progressRef.current = p

    // Hide scroll indicator via DOM (no re-render)
    if (p > 0.02 && !indicatorHiddenRef.current) {
      indicatorHiddenRef.current = true
      const el = scrollIndicatorRef.current
      if (el) {
        el.style.opacity = '0'
        el.style.transform = 'translateY(20px) translateX(-50%)'
        // Remove from DOM after animation
        setTimeout(() => { if (el) el.style.display = 'none' }, 600)
      }
    }
  }, [])

  // Video ready callback — stable, no deps needed
  const handleLoaded = useCallback(() => {
    setVideosLoaded(true)
  }, [])

  return (
    <main className="bg-cream min-h-screen">
      {/* ═══════════════════════════════════════════
          HERO — Scrollytelling Section
          ═══════════════════════════════════════════ */}
      <div className="relative">
        {/* Sticky video background — pins and scrubs */}
        <VideoSequence
          onProgress={handleProgress}
          onLoaded={handleLoaded}
        />

        {/* Text overlays — reads progressRef directly, zero re-renders */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            zIndex: 10,
            opacity: videosLoaded ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }}
        >
          <ScrollOverlayText progressRef={progressRef} />
        </div>

        {/* ── Brand Wordmark — fixed top bar ── */}
        <div
          className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 lg:px-16 py-5"
          style={{
            opacity: videosLoaded ? 1 : 0,
            transition: 'opacity 0.8s ease 0.3s',
            pointerEvents: videosLoaded ? 'auto' : 'none',
          }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/15 flex items-center justify-center">
              <span className="text-white text-sm font-serif font-bold tracking-wider">N</span>
            </div>
            <span className="text-white/90 text-[13px] font-serif tracking-[0.25em] hidden sm:inline uppercase">
              Naturals
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-10">
            {['Story', 'Flavors', 'Stores'].map((link) => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                className="text-white/50 text-[11px] tracking-[0.25em] uppercase
                           hover:text-white/90 transition-colors duration-500"
              >
                {link}
              </a>
            ))}
          </nav>
        </div>

        {/* ── Scroll Indicator — bouncing arrow ── */}
        <div
          ref={scrollIndicatorRef}
          className="scroll-indicator fixed bottom-10 left-1/2 z-20 flex flex-col items-center gap-2.5"
          style={{
            opacity: videosLoaded ? 1 : 0,
            transition: 'opacity 0.6s ease, transform 0.6s ease',
            pointerEvents: 'none',
          }}
        >
          <span className="text-white/50 text-[9px] tracking-[0.4em] uppercase font-light">
            Scroll to explore
          </span>
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          CONTENT — Standard Flow (after pin releases)
          ═══════════════════════════════════════════ */}
      <StorySection />
      <FlavorCarousel />
      <FindStoreFooter />
    </main>
  )
}

import { useEffect, useRef, useCallback } from 'react'

/**
 * SCENES — enriched scene data
 *
 * Each scene has:
 *  • range         — [start, end] in 0–1 scroll progress space
 *  • headingLines  — array of { text, cls } for multi-line typographic hierarchy
 *  • align         — 'left' | 'center' | 'right' — affects scene container flex layout
 *  • entryDir      — 'bottom' | 'scale' | 'right' — how elements arrive
 *  • subClass      — Tailwind class string for the subheading style
 *  • lineOrigin    — CSS transform-origin for the decorative line
 */
const SCENES = [
  {
    id: 'scene-1',
    range: [0, 0.333],
    tag: '01 — The Origin',
    headingLines: [
      {
        text: 'Authentic',
        cls: 'block text-3xl sm:text-4xl md:text-5xl font-normal tracking-[-0.01em] text-white/90 leading-none',
      },
      {
        text: 'Flavor',
        cls: 'block text-[4.5rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] xl:text-[12.5rem] leading-[0.82] -mt-1 md:-mt-2 tracking-[-0.03em]',
      },
    ],
    subheading: 'Made From Real Tender Coconut',
    align: 'left',
    entryDir: 'bottom',
    subClass: 'text-left text-sm sm:text-base md:text-lg text-white/60 font-light tracking-[0.06em]',
    lineOrigin: 'left',
  },
  {
    id: 'scene-2',
    range: [0.333, 0.666],
    tag: '02 — The Classics',
    headingLines: [
      {
        text: 'The',
        cls: 'block text-[10px] sm:text-xs tracking-[0.65em] uppercase text-white/40 font-light leading-none mb-3',
      },
      {
        text: 'Classics',
        cls: 'block text-[4.5rem] sm:text-[6rem] md:text-[7.5rem] lg:text-[9.5rem] xl:text-[11.5rem] leading-[0.88] tracking-[-0.03em]',
      },
    ],
    subheading: 'Mango. Coconut. Strawberry.',
    align: 'center',
    entryDir: 'scale',
    subClass: 'text-center text-sm sm:text-base md:text-lg text-white/60 font-light tracking-[0.3em] uppercase',
    lineOrigin: 'center',
  },
  {
    id: 'scene-3',
    range: [0.666, 1],
    tag: '03 — The Experience',
    headingLines: [
      {
        text: 'Summer in',
        cls: 'block text-2xl sm:text-3xl md:text-4xl italic font-light tracking-[-0.01em] text-white/80 leading-tight',
      },
      {
        text: 'Every Bite',
        cls: 'block text-[4rem] sm:text-[5.5rem] md:text-[7rem] lg:text-[9rem] xl:text-[11rem] italic leading-[0.87] -mt-1 tracking-[-0.02em]',
      },
    ],
    subheading: 'Fresh. Real. Naturals.',
    align: 'right',
    entryDir: 'right',
    subClass: 'text-right text-sm sm:text-base md:text-lg text-white/60 font-light tracking-[0.12em]',
    lineOrigin: 'right',
  },
]

/**
 * Per-alignment container flex classes.
 * Left and right both sit in the bottom ~40% of the viewport.
 * Center is vertically and horizontally centred.
 */
const CONTAINER_CLS = {
  left:   'flex-col items-start justify-end pb-20 sm:pb-28 md:pb-36 lg:pb-44 pl-8 sm:pl-14 md:pl-20 lg:pl-28',
  center: 'flex-col items-center justify-center',
  right:  'flex-col items-end justify-end pb-20 sm:pb-28 md:pb-36 lg:pb-44 pr-8 sm:pr-14 md:pr-20 lg:pr-28',
}

const smoothstep = (t) => t * t * (3 - 2 * t)

/**
 * ScrollOverlayText
 *
 * Three cinematically choreographed text scenes laid over the scrubbing hero video.
 *
 * Architecture:
 *  • Receives progressRef (mutable ref from parent) — zero React re-renders on scroll
 *  • Own rAF loop reads ref and writes directly to DOM elements
 *  • Per-scene directional entry / exit transforms
 *  • Side progress indicator: 3 fill-bars on right edge, DOM-driven
 *
 * @param {React.MutableRefObject<number>} progressRef — scroll progress 0→1
 */
export default function ScrollOverlayText({ progressRef }) {
  const sceneRefs   = useRef([])
  const tagRefs     = useRef([])
  const headingRefs = useRef([])
  const subRefs     = useRef([])
  const lineRefs    = useRef([])

  // Scene progress indicator (right edge)
  const dotContRefs  = useRef([])   // outer wrapper (opacity)
  const dotFillRefs  = useRef([])   // inner fill (scaleY)

  const rafRef          = useRef(null)
  const lastProgressRef  = useRef(-1)

  /**
   * Apply all DOM transforms for scene `i` at the given scroll `progress`.
   *
   * Timing window:
   *   28% of scene range → fade-in
   *   44% → fully visible plateau
   *   28% → fade-out
   */
  const applyScene = useCallback((i, progress) => {
    const scene     = SCENES[i]
    const el        = sceneRefs.current[i]
    const tagEl     = tagRefs.current[i]
    const headingEl = headingRefs.current[i]
    const subEl     = subRefs.current[i]
    const lineEl    = lineRefs.current[i]
    if (!el || !scene) return

    const [start, end] = scene.range
    const span = end - start

    const fadeInEnd    = start + span * 0.28
    const fadeOutStart = end   - span * 0.28

    // ── Phase resolution ──
    let opacity = 0
    let tIn = 0
    let tOut = 0
    let phase = 'hidden'

    if (progress >= start && progress <= fadeInEnd) {
      tIn     = smoothstep((progress - start) / (fadeInEnd - start))
      opacity = tIn
      phase   = 'in'
    } else if (progress > fadeInEnd && progress < fadeOutStart) {
      opacity = 1
      phase   = 'visible'
    } else if (progress >= fadeOutStart && progress <= end) {
      tOut    = smoothstep((progress - fadeOutStart) / (end - fadeOutStart))
      opacity = 1 - tOut
      phase   = 'out'
    }

    // ── Entry / Exit transforms — translate + opacity only (GPU compositor path) ──
    let xH = 0, yH = 0
    let xS = 0, yS = 0
    let xT = 0, yT = 0

    if (phase === 'in') {
      const inv = 1 - tIn
      switch (scene.entryDir) {
        case 'bottom': yH = 55*inv; yS = 70*inv; yT = 28*inv; break
        case 'scale':  yH = 38*inv; yS = 52*inv; yT = 22*inv; break  // y-only, no scale()
        case 'right':  xH = 80*inv; xS = 60*inv; xT = 40*inv; break
        default: break
      }
    } else if (phase === 'out') {
      yH = -38 * tOut
      yS = -22 * tOut
      yT = -48 * tOut
    }

    // ── Batch DOM writes — transform + opacity only, zero repaints ──
    el.style.opacity    = opacity
    el.style.visibility = opacity > 0.005 ? 'visible' : 'hidden'

    if (tagEl)     tagEl.style.transform     = `translate(${xT}px, ${yT}px)`
    if (headingEl) headingEl.style.transform  = `translate(${xH}px, ${yH}px)`
    if (subEl)     subEl.style.transform      = `translate(${xS}px, ${yS}px)`
    // No filter:blur — forces full compositing repaint every frame
    if (lineEl) {
      const lScale = phase === 'in' ? tIn : phase === 'out' ? (1 - tOut) : 1
      lineEl.style.transform = `scaleX(${lScale})`
    }
  }, [])

  /**
   * Drive the right-edge scene progress indicator.
   * Each bar fills (scaleY 0→1) as progress moves through that scene.
   * Completed scenes stay filled at reduced opacity.
   */
  const applyDots = useCallback((progress) => {
    for (let i = 0; i < SCENES.length; i++) {
      const cont = dotContRefs.current[i]
      const fill = dotFillRefs.current[i]
      if (!cont || !fill) continue

      const [start, end] = SCENES[i].range

      if (progress >= start && progress <= end) {
        // Active scene — fill bar represents progress within scene
        const t = (progress - start) / (end - start)
        cont.style.opacity = '1'
        fill.style.transform = `scaleY(${t})`
      } else if (progress > end) {
        // Past scene — fully filled, muted
        cont.style.opacity = '0.4'
        fill.style.transform = 'scaleY(1)'
      } else {
        // Future scene — empty
        cont.style.opacity = '0.15'
        fill.style.transform = 'scaleY(0)'
      }
    }
  }, [])

  // rAF loop — throttled: skips DOM writes entirely on idle frames
  useEffect(() => {
    const loop = () => {
      const p = progressRef.current
      if (Math.abs(p - lastProgressRef.current) > 0.0004) {
        lastProgressRef.current = p
        for (let i = 0; i < SCENES.length; i++) applyScene(i, p)
        applyDots(p)
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [progressRef, applyScene, applyDots])

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">

      {/* ── Scene text overlays ── */}
      {SCENES.map((scene, i) => (
        <div
          key={scene.id}
          ref={(el) => (sceneRefs.current[i] = el)}
          className={`absolute inset-0 flex ${CONTAINER_CLS[scene.align]}`}
          style={{ opacity: 0, visibility: 'hidden' }}
        >
          {/* Scene tag */}
          <span
            ref={(el) => (tagRefs.current[i] = el)}
            className={`text-white/35 text-[10px] sm:text-[11px] tracking-[0.45em] uppercase font-light mb-3 md:mb-4 ${
              scene.align === 'right'  ? 'text-right'  :
              scene.align === 'center' ? 'text-center' : 'text-left'
            }`}
          >
            {scene.tag}
          </span>

          {/* Multi-line heading — textShadow not filter:drop-shadow (no repaint) */}
          <div
            ref={(el) => (headingRefs.current[i] = el)}
            className="font-serif text-white will-change-transform"
            style={{ textShadow: '0 4px 28px rgba(0,0,0,0.5)' }}
          >
            {scene.headingLines.map((line, j) => (
              <span key={j} className={line.cls}>
                {line.text}
              </span>
            ))}
          </div>

          {/* Subheading */}
          <p
            ref={(el) => (subRefs.current[i] = el)}
            className={`mt-4 md:mt-5 drop-shadow-sm will-change-transform ${scene.subClass}`}
          >
            {scene.subheading}
          </p>

          {/* Expanding decorative line */}
          <div className={`mt-5 md:mt-6 ${ scene.align === 'right' ? 'self-end' : scene.align === 'center' ? 'self-center' : 'self-start' }`}>
            <div
              ref={(el) => (lineRefs.current[i] = el)}
              className="w-16 md:w-20 h-px bg-white/30"
              style={{ transform: 'scaleX(0)', transformOrigin: scene.lineOrigin }}
            />
          </div>
        </div>
      ))}

      {/* ── Right-edge scene progress indicator ── */}
      <div
        className="absolute right-5 md:right-7 lg:right-10 top-1/2 -translate-y-1/2 flex flex-col gap-2"
        aria-hidden="true"
      >
        {SCENES.map((_, i) => (
          <div
            key={i}
            ref={(el) => (dotContRefs.current[i] = el)}
            className="relative overflow-hidden"
            style={{
              width: '1px',
              height: '36px',
              backgroundColor: 'rgba(255,255,255,0.14)',
              opacity: 0.15,
            }}
          >
            {/* Fill bar — scaleY driven by rAF */}
            <div
              ref={(el) => (dotFillRefs.current[i] = el)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(255,255,255,0.85)',
                transformOrigin: 'top',
                transform: 'scaleY(0)',
              }}
            />
          </div>
        ))}
      </div>

    </div>
  )
}

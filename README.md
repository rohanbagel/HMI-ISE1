# Naturals Ice Cream — Scrollytelling Experiment

A premium, scroll-driven landing page for *Naturals Ice Cream*. Built to explore **scrollytelling** as a design pattern — where narrative and visual experience are tightly choreographed to scroll position.

## Overview

This project demonstrates a high-performance scrollytelling implementation using:

- **Canvas-based video scrubbing** (120-frame flipbook, no decoder stalls)
- **Zero-re-render architecture** (mutable refs, direct DOM manipulation via rAF)
- **GSAP ScrollTrigger** with snap points and pinned sections
- **Cinematic text overlays** that animate in sync with scroll progress

The experience is divided into two halves:

1. **Sticky hero** (4500px scroll travel) — video scrubs while three text scenes fade/transform
2. **Content flow** — Story section → Flavor carousel → Store finder footer

---

## Quick Start

```bash
cd naturals-ice-cream
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** The project requires all 120 frame images in `/public/frames/` to be present. If you're starting fresh, see [Generating Frames](#generating-frames).

---

## Architecture

### The Sticky Hero: ScrollTrigger + Canvas Flipbook

**File:** `src/components/VideoSequence.jsx`

- **120 JPEG frames** preload in parallel on mount
- **ScrollTrigger pins** the container for 4500px of scroll
- **rAF loop** maps scroll progress (0→1) to a frame index via `Math.round(progress × 119)`
- **Canvas drawImage()** blits the frame — GPU-accelerated, no video seeking latency

Performance details:

- Throttled draw loop: skips work if progress delta < 0.0004
- Index guard: avoids redrawing if frame index hasn't changed
- First frame painted immediately on load (no blank canvas)

### Text Overlay Choreography

**File:** `src/components/ScrollOverlayText.jsx`

Three scenes, each spanning 33.3% of scroll progress:

| Scene                          | Range        | Heading                  | Entry Direction     | Alignment |
| ------------------------------ | ------------ | ------------------------ | ------------------- | --------- |
| **01 — The Origin**     | 0–0.333     | *Authentic Flavor*     | Bottom slide + fade | Left      |
| **02 — The Classics**   | 0.333–0.666 | *The Classics*         | Scale in + fade     | Center    |
| **03 — The Experience** | 0.666–1.0   | *Summer in Every Bite* | Right slide + fade  | Right     |

Each scene has:

- Tag (e.g., "01 — The Origin")
- Multi-line heading with responsive typography
- Subheading with custom styling
- Decorative line (with directional transform-origin)
- Side progress indicator (3 fill bars on right edge)

**Key performance pattern:** `progressRef` is a mutable ref (not state). `ScrollOverlayText` runs its own rAF loop reading the ref and updating transform/opacity directly on DOM elements. **Zero React re-renders during scroll.**

### Zero-Re-Render Strategy

**File:** `src/pages/Home.jsx`

```jsx
const progressRef = useRef(0)  // ← Mutable, shared between components

const handleProgress = useCallback((p) => {
  progressRef.current = p  // ← Write to ref, not state
  // ...hide scroll indicator via DOM
}, [])

// VideoSequence writes to progressRef
// ScrollOverlayText reads from progressRef
// No useState → zero re-renders on every scroll tick
```

This follows Vercel React Best Practices: **use refs for transient values** (position, progress, etc.) that change on every frame.

---

## Project Structure

```
naturals-ice-cream/
├── public/
│   └── frames/              # 120 JPEG frames (frame_0001.jpg ... frame_0120.jpg)
├── src/
│   ├── pages/
│   │   └── Home.jsx         # Main page: hero + content sections
│   ├── components/
│   │   ├── VideoSequence.jsx       # Canvas flipbook + ScrollTrigger
│   │   ├── ScrollOverlayText.jsx   # 3 cinematic text scenes
│   │   ├── StorySection.jsx        # Editorial brand narrative
│   │   ├── FlavorCarousel.jsx      # Horizontal flavor carousel
│   │   └── FindStoreFooter.jsx     # Store locator + footer
│   ├── App.jsx              # Root wrapper
│   ├── main.jsx             # Vite entry
│   └── index.css            # Global styles + tailwind
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Components

### VideoSequence

Preloads and renders a 120-frame flipbook pinned to viewport. ScrollTrigger controls progress, rAF loop handles canvas rendering.

- **Props:**
  - `onProgress(progress)` — called on every scroll update
  - `onLoaded()` — called when all frames finish loading
- **Features:**
  - Loading overlay with progress bar
  - Snap points at 0%, 33.3%, 66.6%, 100%
  - Grain + gradient overlays for cinematic feel

### ScrollOverlayText

Animates 3 text scenes over the video. Reads `progressRef` directly (no re-renders).

- **Props:**
  - `progressRef` — mutable ref to scroll progress (0–1)
- **Features:**
  - Per-scene entry animations (bottom, scale, right)
  - Side progress indicator (3 fill bars)
  - Directional decorative lines
  - Smooth easing via `smoothstep()`

### StorySection

Editorial 2-column narrative with overlapping design accents. Reveals on viewport entrance via IntersectionObserver.

- GSAP stagger animation
- Lazy content-visibility
- Asymmetric grid layout

### FlavorCarousel

Horizontal scroll-snap grid showcasing 6 ice cream flavors:

- Tender Coconut, Alphonso Mango, Roasted Almond, Strawberry, Sitaphal, Black Currant
- **Features:**

  - Emoji + card per flavor
  - Accent color per flavor
  - CSS scroll-snap (smooth, intuitive)
  - GSAP stagger reveal on intersection

### FindStoreFooter

Premium store locator with city search + footer links.

- **Features:**
  - City pill buttons (Mumbai, Bangalore, Delhi, etc.)
  - Glass-morphism search bar
  - Radial glow accents
  - GSAP stagger reveal

---

## Styling & Design

**Framework:** Tailwind CSS with custom design tokens

**Color Palette:**

- `bg-cream` — light background
- `text-green`, `bg-green-accent` — brand accent
- `text-brown-warm`, `bg-brown-warm` — earthy tones
- `text-gold` — premium detail
- `bg-black-soft` — dark hero background

**Typography:**

- Serif font for headings (elegant, premium)
- Responsive scales: `text-3xl sm:text-4xl md:text-5xl` etc.
- Generous letter-spacing (`tracking-widest`, `tracking-[0.25em]`)

**Animations:**

- All scroll-linked animations driven by rAF + GSAP
- CSS transitions for loading states, hover effects
- Easing curves: `power3.out`, `smoothstep`

---

## Performance Optimizations

### 1. Canvas instead of video

- 120 JPEGs preload in parallel (no decoder overhead)
- `drawImage()` is much faster than video seeking
- Single canvas element, redrawn via rAF

### 2. Mutable refs for scroll progress

- No `useState` for scroll position
- `progressRef` updated in rAF loop
- Text overlay reads ref directly → **zero re-renders during scroll**

### 3. Throttled draw loop

- Skip canvas redraw if progress delta < 0.0004
- Skip frame index calculation if no change
- Avoid DOM layout thrashing

### 4. IntersectionObserver for lazy reveals

- Story, Flavor, Footer sections only animate on viewport entrance
- No scroll listeners on content sections
- Contributes to 60fps scroll on hero

### 5. Hoisted static JSX

- Gradient overlays, grain texture, decorative dots defined outside components
- Prevents re-creation on each render

### 6. content-visibility CSS

- `content-visibility: auto` on sections below fold
- Browser skips layout/paint for off-screen content

---

## Generating Frames

If you need to regenerate the frame sequence:

1. **Source video** (MOV/MP4) → extract 120 frames
2. **Tool options:**

   - FFmpeg: `ffmpeg -i video.mp4 -vf fps=30/120 frames/frame_%04d.jpg`
   - Python + OpenCV
   - Adobe Media Encoder
3. **Place in:** `public/frames/frame_0001.jpg` ... `frame_0120.jpg`
4. **Update `TOTAL_FRAMES`** in `VideoSequence.jsx` if different count

---

## Development

### Scripts

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build locally
```

### Debugging

- Open DevTools → Performance tab → record scroll (60fps target)
- Check rAF loop efficiency: ~16.67ms per frame (60fps)
- Inspect `progressRef.current` in console to verify scroll mapping

### Hot Module Reload (HMR)

Vite auto-reloads on file save. GSAP ScrollTrigger may need manual page refresh if you adjust scroll distances.

---

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires `drawImage()` (canvas), `requestAnimationFrame()`, `IntersectionObserver`.

---


## Credits

Built as a scrollytelling exploration using:

- [GSAP](https://gsap.com/) — ScrollTrigger animation
- [React](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — Build tool
- [Tailwind CSS](https://tailwindcss.com/) — Styling

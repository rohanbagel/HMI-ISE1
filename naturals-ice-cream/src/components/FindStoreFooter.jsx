import { useEffect, useRef, useState, useCallback } from 'react'
import gsap from 'gsap'

/* Quick-access city pills — hoisted (rendering-hoist-jsx) */
const CITIES = ['Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune', 'Chennai']
const FOOTER_LINKS = ['About', 'Flavors', 'Stores', 'Franchise', 'Contact']

/**
 * FindStoreFooter — Premium store locator CTA + brand footer
 *
 * Design (frontend-design skill):
 *  • Full-bleed deep green section with radial glow accents
 *  • Glass-morphism search bar
 *  • City pill buttons with gold hover
 *  • Minimal monochrome footer bar
 *
 * Performance:
 *  • IntersectionObserver for GSAP stagger reveal
 *  • Functional setState for form (rerender-functional-setstate)
 *  • content-visibility on section
 */
export default function FindStoreFooter() {
  const sectionRef = useRef(null)
  const contentRef = useRef(null)
  const [city, setCity] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return

        el.classList.add('is-visible')

        // Staggered reveal
        if (contentRef.current) {
          gsap.fromTo(
            contentRef.current.children,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: 'power3.out' }
          )
        }

        observer.unobserve(el)
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    setCity((curr) => {
      if (!curr.trim()) return curr     // Early exit (js-early-exit)
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 3000)
      return curr
    })
  }, [])

  const handleCityClick = useCallback((c) => {
    setCity(c)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }, [])

  return (
    <footer
      id="stores"
      ref={sectionRef}
      className="fade-in-section"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}
    >
      {/* ── Store Locator Section ── */}
      <section className="bg-green py-28 md:py-40 relative overflow-hidden">
        {/* Decorative radial glows */}
        <div className="absolute top-0 right-0 w-125 h-125 rounded-full bg-green-light/15 -translate-y-1/2 translate-x-1/3 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-87.5 h-87.5 rounded-full bg-green-accent/10 translate-y-1/3 -translate-x-1/4 blur-2xl" />

        <div ref={contentRef} className="max-w-4xl mx-auto px-6 md:px-12 text-center relative z-10">
          {/* Label */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-10 h-px bg-gold/40" />
            <span className="text-gold/80 text-[10px] tracking-[0.4em] uppercase font-medium">
              Visit Us
            </span>
            <div className="w-10 h-px bg-gold/40" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif text-cream mb-5 leading-[1.1]">
            Find a Naturals
            <br />
            <span className="text-gold-light italic">Near You</span>
          </h2>

          <p className="text-cream/50 text-base md:text-lg font-light max-w-md mx-auto mb-12 leading-relaxed">
            Over 140 stores across India. Fresh scoops waiting just around the corner.
          </p>

          {/* Search form — glass morphism */}
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
            <div className="flex gap-3">
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Enter your city..."
                className="flex-1 px-6 py-4 rounded-full bg-white/[0.07] border border-white/15
                           text-cream placeholder:text-cream/30 text-[15px]
                           focus:outline-none focus:border-gold/50 focus:bg-white/10
                           transition-all duration-400 backdrop-blur-xl"
              />
              <button
                type="submit"
                className="px-8 py-4 rounded-full bg-gold text-green font-semibold text-sm
                           tracking-[0.05em] hover:bg-gold-light transition-all duration-400
                           hover:shadow-lg hover:shadow-gold/25 active:scale-[0.97]"
              >
                {submitted ? '✓ Found!' : 'Search'}
              </button>
            </div>
          </form>

          {/* Quick city pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-2.5">
            {CITIES.map((c) => (
              <button
                key={c}
                onClick={() => handleCityClick(c)}
                className="px-4 py-1.5 rounded-full border border-cream/15 text-cream/40
                           text-[11px] tracking-[0.15em] uppercase
                           hover:border-gold/50 hover:text-gold hover:bg-gold/5
                           transition-all duration-400"
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer Bar ── */}
      <div className="bg-black-soft py-10 md:py-12">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-green/80 flex items-center justify-center">
                <span className="text-cream text-xs font-serif font-bold">N</span>
              </div>
              <span className="text-cream/60 text-[13px] font-serif tracking-[0.15em]">
                Naturals Ice Cream
              </span>
            </div>

            {/* Nav */}
            <nav className="flex gap-7">
              {FOOTER_LINKS.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  className="text-cream/35 text-[12px] tracking-widest uppercase
                             hover:text-gold transition-colors duration-400"
                >
                  {link}
                </a>
              ))}
            </nav>

            {/* Copyright */}
            <p className="text-cream/20 text-[11px] tracking-wide">
              © {new Date().getFullYear()} Naturals Ice Cream
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

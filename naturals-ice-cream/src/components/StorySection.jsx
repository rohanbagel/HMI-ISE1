import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/* Hoisted static JSX (rendering-hoist-jsx) */
const decorativeDots = (
  <div className="flex gap-2">
    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
    <div className="w-1.5 h-1.5 rounded-full bg-green-accent" />
    <div className="w-1.5 h-1.5 rounded-full bg-brown-warm" />
  </div>
)

/**
 * StorySection — Editorial 2-column brand narrative
 *
 * Design (frontend-design skill):
 *  • Asymmetric grid — heading takes more visual weight
 *  • Overlapping decorative accent behind heading
 *  • Large pull-quote style typography
 *  • Staggered GSAP reveal on IntersectionObserver trigger
 *
 * Performance:
 *  • IntersectionObserver for lazy reveal (no scroll listener)
 *  • GSAP stagger animation — one orchestrated moment
 *  • content-visibility: auto on section (rendering-content-visibility)
 */
export default function StorySection() {
  const sectionRef = useRef(null)
  const headingRef = useRef(null)
  const copyRef = useRef(null)
  const accentRef = useRef(null)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return                    // Early exit (js-early-exit)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return  // Early exit

        // Staggered GSAP reveal — one orchestrated entrance
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        if (accentRef.current) {
          tl.fromTo(accentRef.current,
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.8 },
            0
          )
        }
        if (headingRef.current) {
          tl.fromTo(headingRef.current,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9 },
            0.15
          )
        }
        if (copyRef.current) {
          tl.fromTo(copyRef.current,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8 },
            0.35
          )
        }

        el.classList.add('is-visible')
        observer.unobserve(el)
      },
      { threshold: 0.12 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="story"
      ref={sectionRef}
      className="fade-in-section bg-cream py-28 md:py-40 lg:py-52"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 800px' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        {/* Section label */}
        <div className="flex items-center gap-4 mb-14 md:mb-20">
          <div className="w-10 h-px bg-green-accent/60" />
          <span className="text-green-accent text-[10px] tracking-[0.4em] uppercase font-medium">
            Our Story
          </span>
        </div>

        {/* Asymmetric 2-column grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16 lg:gap-24">
          {/* Left — Heading with decorative accent */}
          <div className="relative">
            {/* Decorative circle accent */}
            <div
              ref={accentRef}
              className="absolute -top-8 -left-8 w-32 h-32 md:w-44 md:h-44 rounded-full bg-green/5"
              style={{ opacity: 0 }}
            />

            <div ref={headingRef} style={{ opacity: 0 }}>
              <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] xl:text-[4rem] font-serif text-green leading-[1.1] relative z-10">
                Born in Mysore.
                <br />
                <span className="text-green-light italic">Loved Everywhere.</span>
              </h2>

              {/* Year badge */}
              <div className="mt-8 inline-flex items-center gap-3 px-4 py-2 rounded-full border border-green/10 bg-green/[0.03]">
                <span className="text-green font-serif text-lg">1984</span>
                <span className="text-brown-light text-xs tracking-wide">Year of Origin</span>
              </div>
            </div>
          </div>

          {/* Right — Body copy */}
          <div ref={copyRef} className="flex flex-col justify-center" style={{ opacity: 0 }}>
            <p className="text-brown text-lg md:text-xl leading-[1.8] mb-6 font-light">
              Since 1984, Naturals has been crafting ice cream the way it was
              meant to be — with real fruit, fresh milk, and absolutely no
              artificial flavors. Every scoop carries the warmth of tradition
              and the purity of nature.
            </p>
            <p className="text-brown-light text-base md:text-lg leading-[1.8] mb-10">
              What started as a small parlour in Mysore is now a beloved name
              across India. Our secret? We never compromised. No shortcuts.
              No synthetics. Just the honest taste of real ingredients,
              churned to creamy perfection.
            </p>

            {/* CTA link */}
            <a
              href="#flavors"
              className="inline-flex items-center gap-3 text-green font-medium text-sm tracking-[0.05em]
                         hover:text-green-accent transition-colors duration-500 group w-fit"
            >
              <span>Explore Our Flavors</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="mt-24 lg:mt-36 flex items-center gap-6">
          <div className="flex-1 h-px bg-cream-dark" />
          {decorativeDots}
          <div className="flex-1 h-px bg-cream-dark" />
        </div>
      </div>
    </section>
  )
}

import { useEffect, useRef } from 'react'
import gsap from 'gsap'

/**
 * FLAVOR DATA — hoisted outside component (rendering-hoist-jsx principle)
 * Each flavor: name, description, accent colors, emoji placeholder.
 * In production, replace emojis with actual product photography.
 */
const FLAVORS = [
  {
    id: 'tender-coconut',
    name: 'Tender Coconut',
    description: 'Fresh coconut water frozen into creamy bliss. Pure, clean, unforgettable.',
    accent: '#E8F5E9',
    accentText: '#1B5E20',
    emoji: '🥥',
  },
  {
    id: 'alphonso-mango',
    name: 'Alphonso Mango',
    description: 'Made with handpicked Ratnagiri mangoes. The king of all flavors.',
    accent: '#FFF3E0',
    accentText: '#BF360C',
    emoji: '🥭',
  },
  {
    id: 'roasted-almond',
    name: 'Roasted Almond',
    description: 'Crunchy California almonds in a rich, velvety base. An all-time classic.',
    accent: '#EFEBE9',
    accentText: '#4E342E',
    emoji: '🌰',
  },
  {
    id: 'strawberry',
    name: 'Strawberry',
    description: 'Real Mahabaleshwar strawberries. Sweet, tangy, perfectly balanced.',
    accent: '#FCE4EC',
    accentText: '#B71C1C',
    emoji: '🍓',
  },
  {
    id: 'sitaphal',
    name: 'Sitaphal',
    description: 'Custard apple magic. Seasonal, limited, and absolutely divine.',
    accent: '#F1F8E9',
    accentText: '#33691E',
    emoji: '🍈',
  },
  {
    id: 'black-currant',
    name: 'Black Currant',
    description: 'Deep, fruity, and irresistibly tangy. A burst of berry goodness.',
    accent: '#EDE7F6',
    accentText: '#311B92',
    emoji: '🫐',
  },
]

/**
 * FlavorCarousel — Horizontal scroll flavor showcase
 *
 * Design (frontend-design skill):
 *  • Oversized emoji with scale-on-hover
 *  • Soft card with generous padding and rounded corners
 *  • CSS scroll-snap for tactile card alignment
 *  • GSAP stagger reveal on intersection
 *
 * Performance:
 *  • useRef-based animation guard — no hasAnimated state (rerender-use-ref-transient-values)
 *  • content-visibility on section (rendering-content-visibility)
 *  • IntersectionObserver for lazy reveal
 */
export default function FlavorCarousel() {
  const sectionRef = useRef(null)
  const scrollRef = useRef(null)
  const cardsRef = useRef([])
  const animatedRef = useRef(false)   // Guard — no state needed (rerender-use-ref-transient-values)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return                    // Early exit (js-early-exit)

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return     // Early exit
        if (animatedRef.current) return       // Already animated — bail
        animatedRef.current = true

        el.classList.add('is-visible')

        // GSAP stagger cards
        gsap.fromTo(
          cardsRef.current.filter(Boolean),
          { opacity: 0, y: 60, scale: 0.92 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            stagger: 0.08,
            duration: 0.8,
            ease: 'power3.out',
          }
        )

        observer.unobserve(el)
      },
      { threshold: 0.08 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="flavors"
      ref={sectionRef}
      className="fade-in-section bg-white-soft py-28 md:py-40"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '0 700px' }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        {/* Section header */}
        <div className="flex items-center gap-4 mb-5">
          <div className="w-10 h-px bg-gold/60" />
          <span className="text-gold text-[10px] tracking-[0.4em] uppercase font-medium">
            Our Flavors
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 md:mb-20">
          <h2 className="text-4xl md:text-5xl lg:text-[3.5rem] font-serif text-green leading-[1.1]">
            Crafted by Nature.
            <br />
            <span className="text-green-light italic">Curated for You.</span>
          </h2>
          <p className="text-brown-light text-base md:text-lg mt-4 md:mt-0 max-w-sm font-light leading-relaxed">
            Every flavor tells a story of real fruit, fresh milk,
            and generations of craft.
          </p>
        </div>
      </div>

      {/* Horizontal scroll container */}
      <div
        ref={scrollRef}
        className="flavor-scroll flex gap-5 md:gap-7 overflow-x-auto px-6 md:px-12 lg:px-20 pb-6 snap-x snap-mandatory"
      >
        {FLAVORS.map((flavor, i) => (
          <div
            key={flavor.id}
            ref={(el) => (cardsRef.current[i] = el)}
            className="snap-start shrink-0 w-[280px] md:w-[310px] rounded-3xl overflow-hidden
                       cursor-pointer group transition-all duration-500
                       hover:shadow-2xl hover:-translate-y-2"
            style={{ opacity: 0 }}
          >
            {/* Card image area — oversized emoji */}
            <div
              className="h-60 md:h-72 flex items-center justify-center relative overflow-hidden"
              style={{ backgroundColor: flavor.accent }}
            >
              <span className="text-[5.5rem] md:text-[6.5rem] group-hover:scale-125 group-hover:-rotate-6 transition-transform duration-700 ease-out">
                {flavor.emoji}
              </span>

              {/* Subtle top-right label */}
              <span
                className="absolute top-4 right-5 text-[10px] tracking-[0.2em] uppercase font-medium opacity-40"
                style={{ color: flavor.accentText }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
            </div>

            {/* Card content */}
            <div className="p-6 md:p-7 bg-white">
              <h3
                className="font-serif text-xl md:text-2xl mb-2.5"
                style={{ color: flavor.accentText }}
              >
                {flavor.name}
              </h3>
              <p className="text-brown-light text-sm leading-[1.7] font-light">
                {flavor.description}
              </p>
            </div>
          </div>
        ))}

        {/* End spacer for scroll padding */}
        <div className="shrink-0 w-6 md:w-12 lg:w-20" />
      </div>
    </section>
  )
}

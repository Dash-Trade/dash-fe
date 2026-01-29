"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface StackSection {
  title: string;
  subtitle: string;
  description: string;
  bgColor: string;
  textColor: string;
}

interface BestScrollStackProps {
  sections: StackSection[];
}

export default function BestScrollStack({ sections }: BestScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const totalSections = sections.length;
    const containerHeight = window.innerHeight * (totalSections + 1);

    // Set container height for scrolling
    containerRef.current.style.height = `${containerHeight}px`;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: ".best-scroll-stack-content",
        pinSpacing: false,
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const newIndex = Math.min(
            Math.floor(progress * totalSections),
            totalSections - 1
          );

          setCurrentIndex(newIndex);

          // Animate cards sequentially - fully reversible
          cardsRef.current.forEach((card, idx) => {
            if (card) {
              // Calculate progress for each card (0 to 1)
              const cardProgress = Math.max(0, Math.min(1, (progress * totalSections) - idx));

              gsap.set(card, {
                opacity: cardProgress,
                x: -50 * (1 - cardProgress),
              });
            }
          });

          // Animate heading
          if (headingRef.current) {
            const headingProgress = Math.min(1, progress * 20);
            gsap.set(headingRef.current, {
              opacity: headingProgress,
              y: 20 * (1 - headingProgress),
            });
          }
        },
      });
    }, containerRef);

    return () => {
      ctx.revert();
    };
  }, [sections.length]);

  const currentSection = sections[currentIndex] || sections[0];

  return (
    <div ref={containerRef} className="relative">
      <div
        className="best-scroll-stack-content h-screen w-full flex items-center justify-center sticky top-0 overflow-hidden transition-colors duration-700"
        style={{
          backgroundColor: currentSection.bgColor,
          color: currentSection.textColor,
        }}
      >
        <div className="container mx-auto px-6 py-20 max-w-7xl h-full flex flex-col items-center justify-center">
          {/* Why Dash? Heading */}
          <div
            ref={headingRef}
            className="text-center mb-12"
            style={{ opacity: 0 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent ">
              WHY WE BEST TAP TRADING DEX?
            </h2>
          </div>

          {/* Cards Grid - Horizontal Layout on desktop, stacked on mobile */}
          <div className="relative w-full max-w-7xl min-h-[500px] md:min-h-0 md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-0">
            {/* Top Border Line - Full Width extending to screen edges */}
            <div className="hidden md:block absolute top-0 left-1/2 -translate-x-1/2 h-px bg-gray-600 w-screen"></div>
            {/* Bottom Border Line - Full Width extending to screen edges */}
            <div className="hidden md:block absolute bottom-0 left-1/2 -translate-x-1/2 h-px bg-gray-600 w-screen"></div>
            {sections.map((section, idx) => (
              <div
                key={idx}
                ref={(el) => {
                  cardsRef.current[idx] = el;
                }}
                className="absolute inset-0 md:relative md:inset-auto flex flex-col px-8 py-20 border border-gray-600 min-h-[500px] md:min-h-[600px]"
                style={{
                  opacity: 0,
                  backgroundColor: "#1a1a1a",
                  color: "#ffffff",
                }}
              >
                {/* Icon in top left - absolute positioning */}
                <div className="absolute top-8 left-8">
                  {/* Different icons for each card */}
                  {idx === 0 && (
                    <svg className="w-12 h-12 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" />
                    </svg>
                  )}
                  {idx === 1 && (
                    <svg className="w-12 h-12 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  {idx === 2 && (
                    <svg className="w-12 h-12 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                  )}
                  {idx === 3 && (
                    <svg className="w-12 h-12 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                      <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>

                {/* Card Content - Centered */}
                <div className="flex-1 flex flex-col items-center justify-center text-center pt-16">
                  <h3 className="text-2xl font-bold leading-tight mb-3 font-[family-name:var(--font-inter)]">
                    {section.title}
                  </h3>

                  <p className="text-sm leading-relaxed opacity-80 font-[family-name:var(--font-inter)]">
                    {section.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

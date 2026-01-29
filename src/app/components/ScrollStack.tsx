"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface StackSection {
  title: string;
  subtitle: string;
  description: string;
  features?: string[];
  image?: string;
  bgColor: string;
  textColor: string;
  customRender?: (currentIndex: number, sectionIndex: number, scrollProgress: number) => React.ReactNode;
}

interface ScrollStackProps {
  sections: StackSection[];
}

export default function ScrollStack({ sections }: ScrollStackProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const headingRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [scrollProgress, setScrollProgress] = useState(0);
  const hasStarted = useRef(false);
  const animatedCards = useRef<Set<number>>(new Set());
  const lastIndex = useRef(-1);

  useEffect(() => {
    if (!containerRef.current) return;

    const totalSections = sections.length;
    const containerHeight = window.innerHeight * totalSections;

    // Set container height for scrolling
    containerRef.current.style.height = `${containerHeight}px`;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: "top top",
        end: "bottom bottom",
        pin: ".scroll-stack-content",
        pinSpacing: false,
        onEnter: () => {
          // Animate first card when entering scroll stack
          if (!hasStarted.current) {
            hasStarted.current = true;
          }

          // Reset and start animation
          setCurrentIndex(0);
          lastIndex.current = 0;
          animatedCards.current.clear();
          animatedCards.current.add(0);

          // Reset all cards to invisible
          cardsRef.current.forEach((card) => {
            if (card) {
              gsap.set(card, { opacity: 0 });
            }
          });

          // Animate heading "Why Dash?"
          if (headingRef.current) {
            gsap.fromTo(
              headingRef.current,
              {
                y: 50,
                opacity: 0
              },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
              }
            );
          }

          // Animate first card
          if (cardsRef.current[0]) {
            gsap.fromTo(
              cardsRef.current[0],
              {
                x: -100,
                opacity: 0
              },
              {
                x: 0,
                y: -60,
                opacity: 1,
                duration: 1,
                ease: "power2.out",
                delay: 0.2
              }
            );
          }
        },
        onLeave: () => {
          // Reset when leaving scroll stack
          hasStarted.current = false;
          setCurrentIndex(-1);
          lastIndex.current = -1;
          animatedCards.current.clear();

          // Kill all ongoing animations and hide heading
          if (headingRef.current) {
            gsap.killTweensOf(headingRef.current);
            gsap.set(headingRef.current, { opacity: 0, y: 0 });
          }

          // Kill all ongoing animations and hide all cards
          cardsRef.current.forEach((card) => {
            if (card) {
              gsap.killTweensOf(card);
              gsap.set(card, { opacity: 0, x: 0, y: 0, transform: "none" });
            }
          });
        },
        onLeaveBack: () => {
          // Reset when scrolling up past scroll stack
          hasStarted.current = false;
          setCurrentIndex(-1);
          lastIndex.current = -1;
          animatedCards.current.clear();

          // Kill all ongoing animations and hide heading
          if (headingRef.current) {
            gsap.killTweensOf(headingRef.current);
            gsap.set(headingRef.current, { opacity: 0, y: 0 });
          }

          // Kill all ongoing animations and hide all cards
          cardsRef.current.forEach((card) => {
            if (card) {
              gsap.killTweensOf(card);
              gsap.set(card, { opacity: 0, x: 0, y: 0, transform: "none" });
            }
          });
        },
        onEnterBack: () => {
          // Reset when scrolling back up into scroll stack
          hasStarted.current = true;
          setCurrentIndex(0);
          lastIndex.current = 0;
          animatedCards.current.clear();
          animatedCards.current.add(0);

          // Reset all cards to invisible
          cardsRef.current.forEach((card) => {
            if (card) {
              gsap.set(card, { opacity: 0 });
            }
          });

          // Animate heading "Why Dash?"
          if (headingRef.current) {
            gsap.fromTo(
              headingRef.current,
              {
                y: 50,
                opacity: 0
              },
              {
                y: 0,
                opacity: 1,
                duration: 0.8,
                ease: "power2.out"
              }
            );
          }

          // Animate first card
          if (cardsRef.current[0]) {
            gsap.fromTo(
              cardsRef.current[0],
              {
                x: -100,
                opacity: 0
              },
              {
                x: 0,
                y: -60,
                opacity: 1,
                duration: 1,
                ease: "power2.out",
                delay: 0.2
              }
            );
          }
        },
        onUpdate: (self) => {
          const progress = self.progress;
          const newIndex = Math.min(
            Math.floor(progress * totalSections),
            totalSections - 1
          );

          // Animate new cards when index changes
          if (newIndex !== lastIndex.current && newIndex >= 0 && !animatedCards.current.has(newIndex)) {
            const positions = [
              { x: -100, y: 0 },
              { x: 0, y: 100 },
              { x: 100, y: 0 }
            ];
            const targetOffsets = [-60, 60, -60];

            if (cardsRef.current[newIndex]) {
              animatedCards.current.add(newIndex);
              gsap.fromTo(
                cardsRef.current[newIndex],
                {
                  x: positions[newIndex % 3].x,
                  y: positions[newIndex % 3].y,
                  opacity: 0
                },
                {
                  x: 0,
                  y: targetOffsets[newIndex % 3],
                  opacity: 1,
                  duration: 1,
                  ease: "power2.out",
                  delay: 0.2
                }
              );
            }
            lastIndex.current = newIndex;
          }

          setCurrentIndex(newIndex);
          setScrollProgress(progress);
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
      <div className="scroll-stack-content h-screen w-full flex items-center justify-center sticky top-0 overflow-hidden">
        <div
          className="absolute inset-0 transition-colors duration-700"
          style={{
            backgroundColor: currentSection.bgColor,
            color: currentSection.textColor,
          }}
        >
          {/* Render all custom renders for proper animation */}
          {sections.map((section, idx) =>
            section.customRender ? (
              <div key={idx}>
                {section.customRender(currentIndex, idx, scrollProgress)}
              </div>
            ) : null
          )}

          {/* Default render for non-custom sections - Card Layout */}
          {!currentSection.customRender && (
          <div className="container mx-auto px-6 py-20 max-w-7xl h-full flex items-center justify-center pt-32">
            {/* Why Dash? Heading */}
            <div
              ref={headingRef}
              className="absolute top-24 left-1/2 -translate-x-1/2 text-center"
              style={{ opacity: 0 }}
            >
              <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent font-[family-name:var(--font-cinzel-decorative)]">
                Why Dash?
              </h2>
            </div>

            <div className="relative w-full min-h-[400px] md:min-h-0 md:grid md:grid-cols-3 md:gap-8 items-center" style={{ transform: 'translateY(48px)' }}>
              {sections
                .filter(section => !section.customRender)
                .map((section, idx) => {
                  return (
                    <div
                      key={idx}
                      ref={(el) => {
                        cardsRef.current[idx] = el;
                      }}
                      className="absolute inset-0 md:relative md:inset-auto flex flex-col p-6 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm"
                      style={{
                        opacity: 0,
                      }}
                    >
                      {/* Card Image */}
                      <div className="relative rounded-xl overflow-hidden shadow-2xl mb-6 bg-gray-800/50 aspect-[4/3] border border-cyan-400/10">
                        {section.image && (
                          <img
                            src={section.image}
                            alt={section.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
                            {section.subtitle}
                          </p>
                          <h3 className="text-2xl font-bold leading-tight">
                            {section.title}
                          </h3>
                        </div>

                        <p className="text-sm opacity-80 leading-relaxed">
                          {section.description}
                        </p>

                        {section.features && section.features.length > 0 && (
                          <ul className="space-y-2 mt-4">
                            {section.features.slice(0, 3).map((feature, featureIdx) => (
                              <li
                                key={featureIdx}
                                className="flex items-start gap-2 text-sm"
                              >
                                <svg
                                  className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <span className="opacity-80">{feature}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          )}
        </div>
      </div>
    </div>
  );
}

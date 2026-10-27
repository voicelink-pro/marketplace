"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./how-it-works.module.css";

/**
 * The "How it works" section element. Runs the card glow and beam cycle
 * (CSS, see how-it-works.module.css) once the visitor has scrolled and at
 * least 40% of the section is visible; stops when it leaves the viewport,
 * so coming back starts again from card 1.
 */
export function HowItWorksSection({ children }: { children: React.ReactNode }) {
  const section = useRef<HTMLElement>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const node = section.current;
    if (!node) return;
    // Opening the page already scrolled (restored position, #how-it-works) counts as scrolling.
    let scrolled = window.scrollY > 0;
    let visibleEnough = false;
    const update = () => setRunning(scrolled && visibleEnough);

    const onScroll = () => {
      scrolled = true;
      update();
    };
    if (!scrolled)
      window.addEventListener("scroll", onScroll, {
        once: true,
        passive: true,
      });

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.4) visibleEnough = true;
        else if (!entry.isIntersecting) visibleEnough = false;
        update();
      },
      { threshold: [0, 0.4] },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <section
      ref={section}
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className={`flex scroll-mt-36 flex-col gap-6 lg:scroll-mt-24 ${running ? styles.running : ""}`}
    >
      {children}
    </section>
  );
}

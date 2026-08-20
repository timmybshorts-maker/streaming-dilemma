'use client';

/**
 * Parallax-Effekt für das Hintergrundbild
 * Erstellt einen subtilen Bewegungseffekt, wenn man scrollt
 */
export function initParallaxEffect() {
  if (typeof window === 'undefined') return;
  
  const handleScroll = () => {
    const scrolled = window.scrollY;
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    parallaxElements.forEach((element) => {
      const speed = parseFloat(element.getAttribute('data-parallax') || '0.5');
      (element as HTMLElement).style.transform = `translateY(${scrolled * speed}px)`;
    });
  };
  
  window.addEventListener('scroll', handleScroll, { passive: true });
  
  return () => {
    window.removeEventListener('scroll', handleScroll);
  };
}

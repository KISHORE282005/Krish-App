import { useEffect } from 'react';

// Surfaces that follow the mouse. The planner's own <Tilt> cards are excluded.
const TILT_SELECTOR = '.glass-card, .surface-card, .streak-badge, .knowledge-card, .achievement-card, .hero-section, .habit-item';

/* Delegated pointer tilt: one listener drives every card on every page. */
export function useTilt3D() {
  useEffect(() => {
    let current = null;

    const reset = (el) => {
      el.classList.remove('is-tilting');
      el.style.removeProperty('--rx');
      el.style.removeProperty('--ry');
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    };

    const onMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target.closest?.(TILT_SELECTOR);
      if (current && current !== el) reset(current);
      current = el;
      if (!el) return;

      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const max = r.height > 240 ? 3 : 7; // big cards tilt less
      el.classList.add('is-tilting');
      el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    };

    const onLeave = () => { if (current) reset(current); current = null; };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, []);
}

const Cube = ({ className }) => (
  <div className={`cube ${className}`}>{Array.from({ length: 6 }).map((_, i) => <i key={i} />)}</div>
);

/* Fixed background: glowing blobs + slowly spinning wireframe cubes. */
export default function Scene3D() {
  return (
    <div className="scene3d" aria-hidden>
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      <Cube className="c1" /><Cube className="c2" /><Cube className="c3" />
    </div>
  );
}

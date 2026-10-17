import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Accent } from '../types';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Scroll behaviour that respects the reduced-motion preference. */
export const scrollBehavior = (): ScrollBehavior => (prefersReducedMotion() ? 'auto' : 'smooth');

const canHover = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// ─── Hooks ───

/** True once the element has scrolled into view (stays true). */
export const useInView = <T extends Element>(rootMargin = '0px 0px -10% 0px') => {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  // Layout effect: decide before the first paint, so on-screen content never flashes invisible
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Already on screen when the page opens, or no IntersectionObserver: show it straight away.
    // Waiting for an observer callback left content blurred and invisible on some browsers.
    const r = el.getBoundingClientRect();
    if (typeof IntersectionObserver === 'undefined' || (r.top < window.innerHeight && r.bottom > 0)) {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
};

/** Current time in the given time zone, refreshed every 20 seconds. */
export const useLocalTime = (timeZone: string) => {
  const format = () =>
    new Intl.DateTimeFormat('en-IN', { timeZone, hour: 'numeric', minute: '2-digit', hour12: true }).format(new Date());
  const [time, setTime] = useState(format);

  useEffect(() => {
    const id = setInterval(() => setTime(format()), 20000);
    return () => clearInterval(id);
  }, [timeZone]);

  return time;
};

/** Copies text and reports `copied` for a short moment afterwards. */
export const useCopy = (resetAfter = 1800) => {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), resetAfter);
    } catch {
      window.location.href = `mailto:${text}`;
    }
  };
  return { copied, copy };
};

// ─── Accent helpers ───

/** Inline style that sets the spotlight glow colour for a card. */
export const glow = (accent: Accent): React.CSSProperties =>
  ({ '--glow': `var(--${accent})` } as React.CSSProperties);

// ─── Components ───

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  as?: React.ElementType;
}

/** Fades, un-blurs and lifts its children in when they scroll into view. */
export const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className = '', as = 'div' }) => {
  const { ref, inView } = useInView<HTMLElement>();
  const Tag = as;
  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'is-in' : ''} ${className}`}
      style={{ '--d': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </Tag>
  );
};

interface SpotlightProps extends React.HTMLAttributes<HTMLDivElement> {
  accent?: Accent;
  /** Tilt the card slightly toward the cursor */
  tilt?: boolean;
}

/** A card with a cursor-following glow and a border that lights up near the cursor. */
export const Spotlight: React.FC<SpotlightProps> = ({ accent = 'saffron', tilt = false, className = '', style, children, ...rest }) => {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    el.style.setProperty('--mx', `${x}px`);
    el.style.setProperty('--my', `${y}px`);
    if (tilt && canHover() && !prefersReducedMotion()) {
      el.style.setProperty('--ry', `${((x / r.width) - 0.5) * 5}deg`);
      el.style.setProperty('--rx', `${((y / r.height) - 0.5) * -5}deg`);
    }
  };

  const onLeave = () => {
    ref.current?.style.setProperty('--rx', '0deg');
    ref.current?.style.setProperty('--ry', '0deg');
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`spotlight ${tilt ? 'tilt' : ''} ${className}`}
      style={{ ...glow(accent), ...style }}
      {...rest}
    >
      {children}
    </div>
  );
};

/** Pulls its child a few pixels toward the cursor while hovered. */
export const Magnetic: React.FC<{ children: React.ReactNode; strength?: number; className?: string }> = ({
  children,
  strength = 0.25,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);

  const onMove = (e: React.MouseEvent) => {
    if (!canHover() || prefersReducedMotion() || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * strength;
    const y = (e.clientY - (r.top + r.height / 2)) * strength;
    ref.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const onLeave = () => {
    if (ref.current) ref.current.style.transform = '';
  };

  return (
    <span
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`inline-flex transition-transform duration-300 ease-out ${className}`}
    >
      {children}
    </span>
  );
};

/** Counts up to a number when scrolled into view. Keeps any suffix such as "+". */
export const CountUp: React.FC<{ value: string; className?: string }> = ({ value, className = '' }) => {
  const match = value.match(/^(\d+(?:\.\d+)?)(.*)$/);
  const target = match ? parseFloat(match[1]) : NaN;
  const suffix = match ? match[2] : '';
  const decimals = match && match[1].includes('.') ? match[1].split('.')[1].length : 0;
  const { ref, inView: seen } = useInView<HTMLSpanElement>();
  const [current, setCurrent] = useState(0);
  // If the observer never reports (very old browsers, odd embeds), show the number anyway
  const [late, setLate] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLate(true), 2500);
    return () => clearTimeout(t);
  }, []);
  const inView = seen || late;

  useEffect(() => {
    if (!inView || isNaN(target)) return;
    if (prefersReducedMotion()) {
      setCurrent(target);
      return;
    }
    const duration = 1400;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4);
      setCurrent(target * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  if (isNaN(target)) return <span className={className}>{value}</span>;

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
};

/** Thin gradient bar at the very top showing how far down the page you are. */
export const ScrollProgress: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? window.scrollY / max : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 h-[2px] z-[70] pointer-events-none">
      <div
        ref={ref}
        className="h-full origin-left"
        style={{
          transform: 'scaleX(0)',
          background: 'var(--grad)',
        }}
      />
    </div>
  );
};

// ─── Icons ───

type IconProps = { size?: number; className?: string };

const stroke = (size: number, className: string | undefined, children: React.ReactNode) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const Icon = {
  ArrowRight: ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>),
  ArrowLeft: ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M19 12H5" /><path d="m11 18-6-6 6-6" /></>),
  ArrowDown: ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M12 5v14" /><path d="m6 13 6 6 6-6" /></>),
  ArrowUp: ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M12 19V5" /><path d="m6 11 6-6 6 6" /></>),
  ArrowUpRight: ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M7 17 17 7" /><path d="M8 7h9v9" /></>),
  Download: ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M12 4v11" /><path d="m7 10 5 5 5-5" /><path d="M5 20h14" /></>),
  Mail: ({ size = 16, className }: IconProps) => stroke(size, className, <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>),
  Copy: ({ size = 16, className }: IconProps) => stroke(size, className, <><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>),
  Check: ({ size = 16, className }: IconProps) => stroke(size, className, <path d="m5 12 5 5L20 7" />),
  Sun: ({ size = 16, className }: IconProps) => stroke(size, className, <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  Moon: ({ size = 16, className }: IconProps) => stroke(size, className, <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />),
  Menu: ({ size = 16, className }: IconProps) => stroke(size, className, <path d="M4 8h16M4 16h16" />),
  Close: ({ size = 16, className }: IconProps) => stroke(size, className, <path d="M6 6l12 12M18 6 6 18" />),
  Globe: ({ size = 16, className }: IconProps) => stroke(size, className, <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>),
  Smartphone: ({ size = 16, className }: IconProps) => stroke(size, className, <><rect x="7" y="2" width="10" height="20" rx="2" /><path d="M11 18h2" /></>),
  Chat: ({ size = 16, className }: IconProps) => stroke(size, className, <path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" />),
  Send: ({ size = 16, className }: IconProps) => stroke(size, className, <><path d="M22 2 11 13" /><path d="M22 2 15 22l-4-9-9-4z" /></>),
  Github: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 0-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C17.3 4.6 18.3 5 18.3 5c.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
    </svg>
  ),
  LinkedIn: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
  X: ({ size = 16, className }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24H16.17l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25H8.08l4.71 6.23zm-1.16 17.52h1.83L7.08 4.13H5.12z" />
    </svg>
  ),
};

/** Arrow that slides out and a fresh one slides in when the parent `.group` is hovered. */
export const SlipArrow: React.FC<{ size?: number; className?: string }> = ({ size = 16, className = '' }) => (
  <span className={`arrow-slip ${className}`}>
    <Icon.ArrowUpRight size={size} />
    <Icon.ArrowUpRight size={size} />
  </span>
);

/**
 * Tracks the `dark` class on <html>, which the theme hook toggles.
 * `deferred` waits until the page has painted the new theme before reporting it, so heavy
 * work keyed on it (rebuilding the 3D world) never delays the theme switch on screen.
 */
export const useDarkMode = ({ deferred = false } = {}) => {
  const read = () => document.documentElement.classList.contains('dark');
  const [dark, setDark] = useState(read);
  useEffect(() => {
    let frame = 0;
    const observer = new MutationObserver(() => {
      if (!deferred) return setDark(read());
      cancelAnimationFrame(frame);
      // Two frames: the first lets the browser paint the new colours, the second runs after it
      frame = requestAnimationFrame(() => { frame = requestAnimationFrame(() => setDark(read())); });
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [deferred]);
  return dark;
};

let webglSupport: boolean | undefined;
/**
 * Whether the 3D scenes can run here. False with ?nogl=1 (layout checks), or when the device or
 * browser has no WebGL; the scenes then fall back to a flat background instead of crashing the page.
 */
export const canUseWebGL = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (new URLSearchParams(window.location.search).has('nogl')) return false;
  if (webglSupport === undefined) {
    try {
      const c = document.createElement('canvas');
      webglSupport = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch {
      webglSupport = false;
    }
  }
  return webglSupport;
};

import React from 'react';

/* ─────────────────────────────────────────────────
   TharaLogo — Animated inline SVG logo
   
   Props:
     variant  'full' | 'wordmark' | 'icon'
     size     'sm' | 'md' | 'lg' | 'xl'
     className
───────────────────────────────────────────────── */

const SIZES = {
  sm: { scale: 0.38, width: 110,  height: 40  },
  md: { scale: 0.55, width: 160,  height: 58  },
  lg: { scale: 0.75, width: 218,  height: 79  },
  xl: { scale: 1.00, width: 360,  height: 140 },   // matches SVG viewBox exactly
};

/* ── Icon only (the 🛺 badge) ── */
const IconOnly = ({ size = 'md' }) => {
  const s = { sm:36, md:48, lg:64, xl:88 }[size];
  const r = { sm:10, md:14, lg:18, xl:24 }[size];
  return (
    <div style={{
      width: s, height: s,
      borderRadius: r,
      background: 'linear-gradient(135deg, rgba(245,158,11,0.22), rgba(245,158,11,0.06))',
      border: '1.5px solid rgba(245,158,11,0.30)',
      boxShadow: '0 0 24px rgba(245,158,11,0.18)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: s * 0.5,
      flexShrink: 0,
      animation: 'floatY 4s ease-in-out infinite',
    }}>
      🛺
    </div>
  );
};

/* ── Full SVG wordmark with animated star ── */
const Wordmark = ({ size = 'xl', className = '' }) => {
  const { width, height, scale } = SIZES[size];
  const uid = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 360 140"
      width={width}
      height={height}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Thara Ride"
    >
      <defs>
        {/* Gold gradient for base text */}
        <linearGradient id={`g1-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#FDE68A"/>
          <stop offset="40%"  stopColor="#F59E0B"/>
          <stop offset="100%" stopColor="#D97706"/>
        </linearGradient>

        {/* Moving shimmer gradient */}
        <linearGradient id={`gShim-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%"
          gradientUnits="userSpaceOnUse" z1="0" z2="360">
          <stop offset="0%"   stopColor="#F59E0B" stopOpacity="1"/>
          <stop offset="38%"  stopColor="#FDE68A" stopOpacity="1"/>
          <stop offset="50%"  stopColor="#FFFBEB" stopOpacity="1"/>
          <stop offset="62%"  stopColor="#FDE68A" stopOpacity="1"/>
          <stop offset="100%" stopColor="#F59E0B" stopOpacity="1"/>
          <animateTransform attributeName="gradientTransform"
            type="translate" from="-360 0" to="720 0"
            dur="3.5s" repeatCount="indefinite"/>
        </linearGradient>

        {/* Clip text for shimmer */}
        <clipPath id={`tc-${uid}`}>
          <text x="14" y="97"
            fontFamily="'Unbounded', 'Arial Black', Impact, sans-serif"
            fontWeight="900" fontSize="74" letterSpacing="-2">THARA</text>
        </clipPath>

        {/* Star glow filter */}
        <filter id={`sg-${uid}`} x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4"   result="b1"/>
          <feGaussianBlur in="SourceGraphic" stdDeviation="8.5" result="b2"/>
          <feColorMatrix in="b2" type="matrix"
            values="1 0.6 0 0 0.1  0.6 0.4 0 0 0  0 0 0 0 0  0 0 0 0.6 0" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="b1"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        {/* Text soft glow */}
        <filter id={`tg-${uid}`} x="-3%" y="-8%" width="106%" height="124%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="b"/>
          <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>

      {/* ── Base gold text ── */}
      <text x="14" y="97"
        fontFamily="'Unbounded', 'Arial Black', Impact, sans-serif"
        fontWeight="900" fontSize="74" letterSpacing="-2"
        fill={`url(#g1-${uid})`}
        filter={`url(#tg-${uid})`}>
        THARA
      </text>

      {/* ── Shimmer layer clipped to text ── */}
      <rect x="0" y="0" width="360" height="140"
        fill={`url(#gShim-${uid})`}
        clipPath={`url(#tc-${uid})`}
        opacity="0.42"/>

      {/* ── RIDE subtitle ── */}
      <text x="20" y="124"
        fontFamily="'DM Sans', 'Helvetica Neue', Arial, sans-serif"
        fontWeight="300" fontSize="17" letterSpacing="14"
        fill="rgba(253,230,138,0.48)">
        RIDE
      </text>

      {/* ── Separator line ── */}
      <line x1="14" y1="106" x2="310" y2="106"
        stroke="rgba(245,158,11,0.12)" strokeWidth="1"/>

      {/* ── Animated star above last A ── */}
      <g transform="translate(292,26)">

        {/* Outer pulsing aura */}
        <circle cx="0" cy="0" r="18" fill="none"
          stroke="rgba(245,158,11,0.22)" strokeWidth="1">
          <animate attributeName="r"       values="14;26;14"  dur="2.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.55;0;0.55" dur="2.5s" repeatCount="indefinite"/>
        </circle>

        {/* Second aura */}
        <circle cx="0" cy="0" r="10" fill="none"
          stroke="rgba(253,230,138,0.18)" strokeWidth="0.8">
          <animate attributeName="r"       values="8;18;8"    dur="2.5s" begin="0.9s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2.5s" begin="0.9s" repeatCount="indefinite"/>
        </circle>

        {/* Main 5-point star — twinkle */}
        <path
          d="M0,-13 L2.99,-4.38 L12.37,-4.03 L5.01,1.67 L7.65,10.91 L0,5.59 L-7.65,10.91 L-5.01,1.67 L-12.37,-4.03 L-2.99,-4.38 Z"
          fill={`url(#g1-${uid})`}
          filter={`url(#sg-${uid})`}>
          <animateTransform attributeName="transform" additive="sum"
            type="scale"
            values="1;1.3;0.85;1.2;0.95;1"
            keyTimes="0;0.2;0.4;0.6;0.8;1"
            dur="2.8s" repeatCount="indefinite"/>
          <animate attributeName="opacity"
            values="1;0.72;1;0.82;1;0.88;1"
            dur="2.8s" repeatCount="indefinite"/>
        </path>

        {/* Inner white counter-rotating star */}
        <path
          d="M0,-7.5 L1.73,-2.53 L7.13,-2.33 L2.89,0.96 L4.41,6.29 L0,3.22 L-4.41,6.29 L-2.89,0.96 L-7.13,-2.33 L-1.73,-2.53 Z"
          fill="white" opacity="0.55">
          <animateTransform attributeName="transform"
            type="rotate" from="0" to="-360" dur="7s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.55;0.12;0.7;0.18;0.55" dur="2.8s" repeatCount="indefinite"/>
        </path>

        {/* 4-point sparkle cross */}
        <path d="M0,-17 L1.1,-1.1 L17,0 L1.1,1.1 L0,17 L-1.1,1.1 L-17,0 L-1.1,-1.1 Z"
          fill="#FDE68A">
          <animate attributeName="opacity" values="0;0;0.48;0" dur="2.8s" begin="0.55s"
            repeatCount="indefinite" keyTimes="0;0.28;0.55;1"/>
          <animateTransform attributeName="transform"
            type="rotate" from="0" to="45" dur="2.8s" begin="0.55s" repeatCount="indefinite"/>
        </path>

        {/* Sparkle dots */}
        {[
          { cx:19,  cy:-12, r:2.5,  color:'#FDE68A', begin:'0s'    },
          { cx:-21, cy:-4,  r:2.0,  color:'#F59E0B', begin:'0.75s' },
          { cx:17,  cy:14,  r:2.0,  color:'#FDE68A', begin:'1.3s'  },
          { cx:-15, cy:13,  r:1.5,  color:'#FFFBEB', begin:'1.9s'  },
          { cx:-18, cy:-14, r:1.5,  color:'#F59E0B', begin:'0.4s'  },
        ].map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.color}>
            <animate attributeName="opacity" values="0;1;0" dur="2.2s" begin={p.begin} repeatCount="indefinite"/>
            <animate attributeName="r" values={`${p.r*0.4};${p.r};${p.r*0.2}`} dur="2.2s" begin={p.begin} repeatCount="indefinite"/>
          </circle>
        ))}
      </g>
    </svg>
  );
};

/* ── Main export ── */
const TharaLogo = ({
  variant  = 'full',   // 'full' | 'wordmark' | 'icon'
  size     = 'xl',
  className = '',
}) => {
  if (variant === 'icon')     return <IconOnly size={size} />;
  if (variant === 'wordmark') return <Wordmark size={size} className={className} />;

  /* full = icon + wordmark side by side */
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <IconOnly size={size} />
      <Wordmark size={size} />
    </div>
  );
};

export { Wordmark, IconOnly };
export default TharaLogo;
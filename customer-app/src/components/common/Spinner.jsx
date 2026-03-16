import React from 'react';

const SIZES = {
  sm:  32,
  md:  44,
  lg:  56,
  xl:  72,
};

const resolveSize = (size) => {
  if (typeof size === 'number') return size;
  return SIZES[size] ?? SIZES.md;
};

// ── Inline spinning star ring ──
export const StarSpinner = ({ size = 'md', className = '' }) => {
  const px  = resolveSize(size);
  const cx  = px / 2;
  const r   = px * 0.38;
  const strokeW = Math.max(2, px * 0.07);

  return (
    <svg
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      className={className}
      aria-label="Loading"
    >
      {/* Track */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#f59e0b22"
        strokeWidth={strokeW}
      />
      {/* Arc */}
      <circle
        cx={cx}
        cy={cx}
        r={r}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={strokeW}
        strokeLinecap="round"
        strokeDasharray={`${r * 1.4} ${r * 5}`}
        transform={`rotate(-90 ${cx} ${cx})`}
      >
        <animateTransform
          attributeName="transform"
          type="rotate"
          from={`-90 ${cx} ${cx}`}
          to={`270 ${cx} ${cx}`}
          dur="0.9s"
          repeatCount="indefinite"
        />
      </circle>
      {/* Centre star dot */}
      <circle cx={cx} cy={cx} r={strokeW * 0.9} fill="#f59e0b">
        <animate attributeName="opacity" values="1;0.3;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
};

// ── Full-page overlay ──
export const FullPageSpinner = ({ text = 'Loading...' }) => (
  <div className="fixed inset-0 bg-[#07070e] flex flex-col items-center justify-center z-50 gap-4">
    <StarSpinner size="xl" />
    {text && <p className="text-white/40 text-sm tracking-widest uppercase">{text}</p>}
  </div>
);

// ── Inline button spinner ──
export const ButtonSpinner = () => (
  <StarSpinner size={18} className="inline-block mr-2 align-middle" />
);

export default StarSpinner;
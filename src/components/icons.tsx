import type React from "react";

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const base = (size: number, className?: string, style?: React.CSSProperties) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  style,
});

export function BrainIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M9.5 3.5a2.5 2.5 0 0 0-2.5 2.5 2.5 2.5 0 0 0-1 4.8 2.5 2.5 0 0 0 .5 4.7A2.5 2.5 0 0 0 9 19a2 2 0 0 0 3 .5V5a2 2 0 0 0-2.5-1.5Z" />
      <path d="M14.5 3.5a2.5 2.5 0 0 1 2.5 2.5 2.5 2.5 0 0 1 1 4.8 2.5 2.5 0 0 1-.5 4.7A2.5 2.5 0 0 1 15 19a2 2 0 0 1-3 .5" />
      <path d="M12 4.5v15" opacity="0.4" />
    </svg>
  );
}

export function SystemsIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="6" cy="18" r="2" />
      <circle cx="18" cy="18" r="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M8 6h8M8 18h8M6 8v8M18 8v8M8 8l2.5 2.5M16 8l-2.5 2.5M8 16l2.5-2.5M16 16l-2.5-2.5" opacity="0.6" />
    </svg>
  );
}

export function ActivityIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M2 12h4l2-7 4 14 2-7h8" />
    </svg>
  );
}

export function LabIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M9 3v6l-4 8a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-4-8V3" />
      <path d="M7 3h10" />
      <path d="M7 15h10" opacity="0.5" />
    </svg>
  );
}

export function SearchIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function LayersIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M12 3 2 8l10 5 10-5-10-5Z" />
      <path d="M2 13l10 5 10-5M2 18l10 5 10-5" opacity="0.5" />
    </svg>
  );
}

export function GridIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" opacity="0.5" />
    </svg>
  );
}

export function MaximizeIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

export function SettingsIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1l2.1-2.1M17 7l2.1-2.1" opacity="0.6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function PlusIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function InfoIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

export function TargetIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" />
    </svg>
  );
}

export function CrosshairIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function ZoomInIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5M11 8v6M8 11h6" />
    </svg>
  );
}

export function ZoomOutIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5M8 11h6" />
    </svg>
  );
}

export function RotateIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

export function RulerIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <rect x="3" y="9" width="18" height="6" rx="1" transform="rotate(0 12 12)" />
      <path d="M7 9v3M11 9v3M15 9v3M19 9v3" opacity="0.5" />
    </svg>
  );
}

export function EyeIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CubeIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M12 2 2 7v10l10 5 10-5V7L12 2Z" />
      <path d="M2 7l10 5 10-5M12 12v10" opacity="0.5" />
    </svg>
  );
}

export function PulseIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M2 12h3l2-5 3 10 2-5 2 3h6" />
    </svg>
  );
}

export function PlayIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)} fill="currentColor" stroke="none">
      <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11-7.2a.8.8 0 0 0 0-1.4l-11-7.2a.8.8 0 0 0-1.2.7Z" />
    </svg>
  );
}

export function PauseIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)} fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  );
}

export function WaveformIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M2 12c2-4 3-4 5 0s3 4 5 0 3-4 5 0 3 4 5 0" />
    </svg>
  );
}

export function ShareIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8 11 8-5M8 13l8 5" opacity="0.6" />
    </svg>
  );
}

export function DownloadIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
    </svg>
  );
}

export function CircleIcon({ size = 24, className, style }: IconProps) {
  return (
    <svg {...base(size, className, style)}>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

interface IconProps { className?: string }

const base = "w-full h-full";
const svgProps = {
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MicIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0" />
      <line x1="12" y1="18" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}

export function StopIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" />
    </svg>
  );
}

export function SpeakerIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M17 9a4.5 4.5 0 0 1 0 6" />
      <path d="M19.5 6.5a8 8 0 0 1 0 11" />
    </svg>
  );
}

export function PauseIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <line x1="8" y1="5" x2="8" y2="19" />
      <line x1="16" y1="5" x2="16" y2="19" />
    </svg>
  );
}

/* ── Situation icons ── */

export function ClockIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

export function CodeIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="M9 9l-3 3 3 3" />
      <path d="M15 9l3 3-3 3" />
    </svg>
  );
}

export function ChartIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  );
}

export function AlertIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <path d="M12 3l9 16H3l9-16z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function ClipboardIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <rect x="6" y="4" width="12" height="17" rx="1.5" />
      <rect x="9" y="2.5" width="6" height="3" rx="1" />
      <line x1="8.5" y1="11" x2="15.5" y2="11" />
      <line x1="8.5" y1="15" x2="15.5" y2="15" />
    </svg>
  );
}

export function PersonIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-4 3.5-6.5 7-6.5s7 2.5 7 6.5" />
    </svg>
  );
}

export function CoffeeIcon({ className = "" }: IconProps) {
  return (
    <svg className={`${base} ${className}`} {...svgProps}>
      <path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9z" />
      <path d="M16 10.5h1.5a2.25 2.25 0 0 1 0 4.5H16" />
      <path d="M8 6c0-1 1-1 1-2s-1-1-1-2" />
      <path d="M12 6c0-1 1-1 1-2s-1-1-1-2" />
    </svg>
  );
}

const SITUATION_ICONS: Record<string, (p: IconProps) => JSX.Element> = {
  daily_standup: ClockIcon,
  code_review: CodeIcon,
  client_presentation: ChartIcon,
  incident_response: AlertIcon,
  sprint_planning: ClipboardIcon,
  one_on_one: PersonIcon,
  casual_chat: CoffeeIcon,
};

export function SituationIcon({ id, className = "" }: { id: string; className?: string }) {
  const Icon = SITUATION_ICONS[id] ?? ClipboardIcon;
  return <Icon className={className} />;
}

import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number };

const base = (size = 18) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true
});

export const PlusIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}><path d="M12 5v14M5 12h14" /></svg>
);

export const ArrowIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);

export const SparklesIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <path d="m12 3-1.25 3.75L7 8l3.75 1.25L12 13l1.25-3.75L17 8l-3.75-1.25L12 3Z" />
    <path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8L5 14Z" />
    <path d="m19 13-.65 1.85L16.5 15.5l1.85.65L19 18l.65-1.85 1.85-.65-1.85-.65L19 13Z" />
  </svg>
);

export const GlobeIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18" />
  </svg>
);

export const LockIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <rect x="5" y="10" width="14" height="11" rx="2" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
);

export const LinkIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.15 1.15" />
    <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.15-1.15" />
  </svg>
);

export const TrashIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6" />
  </svg>
);

export const SaveIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <path d="M5 3h12l2 2v16H5V3Z" />
    <path d="M8 3v6h8V3M8 21v-7h8v7" />
  </svg>
);

export const SearchIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </svg>
);

export const ChefIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <path d="M7 10a4 4 0 1 1 3-6.65A4 4 0 0 1 17 6a4 4 0 0 1 0 8H7a4 4 0 0 1 0-8" />
    <path d="M7 14v6h10v-6M9 17h6" />
  </svg>
);

export const RemixIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <path d="M4 7h5a4 4 0 0 1 4 4v6" />
    <path d="m10 14 3 3 3-3" />
    <path d="M20 7h-4a4 4 0 0 0-3 1.35" />
    <path d="m17 4 3 3-3 3" />
  </svg>
);

export const ChartIcon = ({ size, ...props }: Props) => (
  <svg {...base(size)} {...props}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </svg>
);

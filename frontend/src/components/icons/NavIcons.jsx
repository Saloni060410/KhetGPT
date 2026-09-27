import React from 'react';

/**
 * Custom bespoke agricultural navigation icons for KhetGPT.
 * Uniform 24x24 viewBox, 1.8 stroke-width, rounded stroke-caps.
 */

// 1. Home / Farmstead
export function HomeIcon({ size = 18, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <path d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5z" />
      <path d="M9 21v-6h6v6" />
    </svg>
  );
}

// 2. Dashboard / Land Plot Furrows
export function DashboardIcon({ size = 18, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {/* 4 agricultural field plots divided by irrigation channels */}
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
      {/* Furrow lines inside plots */}
      <line x1="5.5" y1="7" x2="8.5" y2="7" />
      <line x1="15.5" y1="7" x2="18.5" y2="7" />
      <line x1="5.5" y1="17" x2="8.5" y2="17" />
      <line x1="15.5" y1="17" x2="18.5" y2="17" />
    </svg>
  );
}

// 3. Field Profile / Seedling & Soil Horizon
export function FieldProfileIcon({ size = 18, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {/* Seedling emerging with 2 curved leaves and root bed */}
      <path d="M12 20V9" />
      <path d="M12 9c0-3.5 3.5-5.5 7-5.5 0 3-1.5 6-7 5.5z" />
      <path d="M12 13c0-3-3-4.5-6-4.5 0 2.5 1.5 5 6 4.5z" />
      <path d="M4 20h16" />
      <path d="M7 23h10" strokeDasharray="1 2" />
    </svg>
  );
}

// 4. Soil Test / Chemistry Flask with Soil Strata
export function SoilTestIcon({ size = 18, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <path d="M10 2v5L4.5 17.5a2.5 2.5 0 0 0 2.2 3.5h10.6a2.5 2.5 0 0 0 2.2-3.5L14 7V2h-4z" />
      <line x1="8.5" y1="2" x2="15.5" y2="2" />
      <path d="M6.5 15h11" strokeDasharray="2 1.5" />
      <circle cx="10" cy="18" r="1" fill="currentColor" />
      <circle cx="14" cy="17.5" r="0.75" fill="currentColor" />
    </svg>
  );
}

// 5. Prescription / Fertilizer Bag (Sack with Wheat Ear)
export function PrescriptionIcon({ size = 18, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {/* Fertilizer sack body with stitched bottom */}
      <path d="M6.5 7.5L5 19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2L17.5 7.5z" />
      {/* Tied stitched top fold */}
      <path d="M6.5 7.5C6.5 6 9 5 12 5s5.5 1 5.5 2.5" />
      <path d="M9.5 5L8.5 2.5" />
      <path d="M14.5 5L15.5 2.5" />
      {/* Seed/grain symbol inside sack */}
      <path d="M12 11v6" />
      <path d="M12 12.5c1.2-.8 2-.6 2-1.5s-.8-1-2-.5" />
      <path d="M12 14.5c-1.2-.8-2-.6-2-1.5s.8-1 2-.5" />
    </svg>
  );
}

// 6. Schedule / Application Calendar & Timeline
export function ScheduleIcon({ size = 18, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <circle cx="8" cy="13.5" r="1" fill="currentColor" />
      <circle cx="12" cy="13.5" r="1" fill="currentColor" />
      <circle cx="16" cy="13.5" r="1" fill="currentColor" />
      <circle cx="8" cy="17.5" r="1" fill="currentColor" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" />
    </svg>
  );
}

// 7. History / Agronomy Season Logbook
export function HistoryIcon({ size = 18, className = '', ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      {...props}
    >
      {/* Season ledger with bookmark */}
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5z" />
      <path d="M6 6h8" />
      <path d="M6 10h8" />
      <path d="M6 14h5" />
      {/* Clock arrow or ribbon indicator */}
      <circle cx="15.5" cy="14.5" r="3.5" />
      <polyline points="15.5 13 15.5 14.5 16.5 15.5" />
    </svg>
  );
}

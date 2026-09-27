import React from 'react';

/**
 * KhetGPT Crop Illustration System (FreshField-adapted)
 * 7 supported crops: wheat, barley, rice, maize, cotton, sugarcane, chickpea
 * Rules:
 * - Soft circular badge behind every icon (r=36, same fill/stroke)
 * - Plant real structure (spikes, droop, cob grid, puffs on calyx, segmented stalk, zigzag stem with pods)
 * - Two colors max: ink outline (#221F19) + one accent fill (#B8791E or #33512E)
 * - Same viewBox="0 0 80 80" and stroke width (2px) across all
 */

export function CropBadgeBackground({ fill = "#EFE9D9", stroke = "#DECFAF" }) {
  return (
    <circle
      cx="40"
      cy="40"
      r="36"
      fill={fill}
      stroke={stroke}
      strokeWidth="1.5"
    />
  );
}

// 1. Wheat: Symmetric grain spike off central stem with delicate terminal awns
export function WheatIcon({ size = 64, className = '', accentColor = '#B8791E', inkColor = '#221F19' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <CropBadgeBackground />
      {/* Central stalk */}
      <path d="M40 70V22" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
      {/* Paired symmetric spikelets */}
      {/* Level 1 (Bottom) */}
      <path d="M40 54C34 52 31 46 33 42C36 43 40 48 40 50" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 54C46 52 49 46 47 42C44 43 40 48 40 50" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Level 2 (Mid-lower) */}
      <path d="M40 46C33 44 30 38 32 34C35 35 40 40 40 42" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 46C47 44 50 38 48 34C45 35 40 40 40 42" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Level 3 (Mid-upper) */}
      <path d="M40 38C34 36 31 30 33 26C36 27 40 32 40 34" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 38C46 36 49 30 47 26C44 27 40 32 40 34" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Terminal apex spikelet */}
      <path d="M40 30C36 24 38 18 40 16C42 18 44 24 40 30Z" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Awn bristles */}
      <path d="M38 16L34 10" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 16L40 8" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 16L46 10" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 2. Barley: Symmetric grain spike with long, prominent straight awns extending outwards
export function BarleyIcon({ size = 64, className = '', accentColor = '#B8791E', inkColor = '#221F19' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <CropBadgeBackground />
      {/* Central stalk */}
      <path d="M40 70V26" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
      {/* Compact paired grains with long awn needles */}
      {/* Pair 1 */}
      <path d="M40 56C35 54 32 49 34 46C37 47 40 52 40 54" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      <path d="M40 56C45 54 48 49 46 46C43 47 40 52 40 54" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      <path d="M33 46L24 38" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M47 46L56 38" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* Pair 2 */}
      <path d="M40 47C35 45 32 40 34 37C37 38 40 43 40 45" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      <path d="M40 47C45 45 48 40 46 37C43 38 40 43 40 45" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      <path d="M33 37L22 28" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M47 37L58 28" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* Pair 3 */}
      <path d="M40 38C35 36 32 31 34 28C37 29 40 34 40 36" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      <path d="M40 38C45 36 48 31 46 28C43 29 40 34 40 36" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      <path d="M33 28L24 16" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M47 28L56 16" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      {/* Terminal awns */}
      <path d="M40 28L40 10" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M38 28L32 10" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 28L48 10" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 3. Rice (Paddy): Drooping curved panicle with pendulous hanging grains
export function RiceIcon({ size = 64, className = '', accentColor = '#B8791E', inkColor = '#221F19' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <CropBadgeBackground />
      {/* Curving main stem arching to the right and drooping */}
      <path d="M30 70C30 52 34 36 44 26C49 21 57 19 61 24C63 27 61 33 55 37" stroke={inkColor} strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Hanging pendulous rice grains */}
      {/* Grain 1 */}
      <ellipse cx="37" cy="38" rx="3.5" ry="6" transform="rotate(-25 37 38)" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      {/* Grain 2 */}
      <ellipse cx="44" cy="30" rx="3.5" ry="6" transform="rotate(-15 44 30)" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      {/* Grain 3 */}
      <ellipse cx="51" cy="25" rx="3.5" ry="6" transform="rotate(20 51 25)" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      {/* Grain 4 */}
      <ellipse cx="58" cy="27" rx="3.5" ry="6" transform="rotate(45 58 27)" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      {/* Grain 5 (Drooping tip) */}
      <ellipse cx="57" cy="37" rx="3.5" ry="6" transform="rotate(75 57 37)" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      {/* Secondary branchlet */}
      <path d="M43 32C41 38 38 46 39 52" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="39" cy="48" rx="3" ry="5.5" transform="rotate(-10 39 48)" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      {/* Flag leaf at base */}
      <path d="M30 56C24 46 22 34 25 24" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 4. Maize: Husked cob with neat kernel grid and silk plume
export function MaizeIcon({ size = 64, className = '', accentColor = '#B8791E', inkColor = '#221F19' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <CropBadgeBackground />
      {/* Central ear of corn */}
      <rect x="33" y="24" width="14" height="32" rx="7" fill={accentColor} stroke={inkColor} strokeWidth="2" />
      {/* Kernel grid lines */}
      <line x1="33" y1="32" x2="47" y2="32" stroke={inkColor} strokeWidth="1.5" />
      <line x1="33" y1="40" x2="47" y2="40" stroke={inkColor} strokeWidth="1.5" />
      <line x1="33" y1="48" x2="47" y2="48" stroke={inkColor} strokeWidth="1.5" />
      <line x1="40" y1="24" x2="40" y2="56" stroke={inkColor} strokeWidth="1.5" />
      {/* Left husk leaf */}
      <path d="M34 58C30 54 26 44 27 34C29 38 33 46 35 52" fill="#EFE9D9" stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Right husk leaf */}
      <path d="M46 58C50 54 54 44 53 34C51 38 47 46 45 52" fill="#EFE9D9" stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Stalk base */}
      <path d="M40 58V70" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
      {/* Silk tassel plume at top */}
      <path d="M38 24C36 18 34 14 31 11" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40 24V10" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 24C44 18 46 14 49 11" stroke={inkColor} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// 5. Cotton: Overlapping soft four-lobed puffs on a woody calyx
export function CottonIcon({ size = 64, className = '', accentColor = '#33512E', inkColor = '#221F19' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <CropBadgeBackground />
      {/* Woody stem */}
      <path d="M40 70V52" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
      {/* Calyx sepals at base of boll */}
      <path d="M30 46L40 53L50 46L44 48L40 53L36 48Z" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      <path d="M40 53L40 45" stroke={inkColor} strokeWidth="2" />
      {/* 4 Soft cloud puffs forming the open cotton boll */}
      {/* Bottom Left puff */}
      <circle cx="33" cy="40" r="8" fill="#FBF8EE" stroke={inkColor} strokeWidth="2" />
      {/* Bottom Right puff */}
      <circle cx="47" cy="40" r="8" fill="#FBF8EE" stroke={inkColor} strokeWidth="2" />
      {/* Top Left puff */}
      <circle cx="34" cy="30" r="8" fill="#FBF8EE" stroke={inkColor} strokeWidth="2" />
      {/* Top Right puff */}
      <circle cx="46" cy="30" r="8" fill="#FBF8EE" stroke={inkColor} strokeWidth="2" />
      {/* Center fluffy intersection */}
      <circle cx="40" cy="34" r="5" fill="#FBF8EE" stroke={inkColor} strokeWidth="1.5" />
      {/* Calyx tips reaching up around bolls */}
      <path d="M26 42C26 36 28 32 30 28" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
      <path d="M54 42C54 36 52 32 50 28" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 6. Sugarcane: Segmented stalk with distinct horizontal nodes and fanning leaf plume
export function SugarcaneIcon({ size = 64, className = '', accentColor = '#33512E', inkColor = '#221F19' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <CropBadgeBackground />
      {/* Main thick segmented stalk */}
      <path d="M37 70V28H43V70H37Z" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Horizontal ring nodes */}
      <line x1="35" y1="60" x2="45" y2="60" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="35" y1="48" x2="45" y2="48" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
      <line x1="35" y1="36" x2="45" y2="36" stroke={inkColor} strokeWidth="2" strokeLinecap="round" />
      {/* Fanning leaf plume at top */}
      {/* Left curving leaf */}
      <path d="M40 28C36 18 24 16 16 22C24 24 34 26 38 28" fill="#EFE9D9" stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Right arching leaf */}
      <path d="M40 28C44 18 56 16 64 22C56 24 46 26 42 28" fill="#EFE9D9" stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Center upright leaf */}
      <path d="M40 28C38 18 39 12 40 8C41 12 42 18 40 28" fill="#EFE9D9" stroke={inkColor} strokeWidth="2" />
    </svg>
  );
}

// 7. Chickpea: Zigzag stem with small swollen legume pods and trifoliate leaflets
export function ChickpeaIcon({ size = 64, className = '', accentColor = '#33512E', inkColor = '#221F19' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <CropBadgeBackground />
      {/* Botanical zigzag stem */}
      <path d="M40 70L40 56L33 46L45 34L38 20" stroke={inkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Swollen chickpea pod 1 (left) */}
      <path d="M33 46C27 46 23 49 22 53C24 57 29 57 33 53Z" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Swollen chickpea pod 2 (right) */}
      <path d="M45 34C51 34 55 37 56 41C54 45 49 45 45 41Z" fill={accentColor} stroke={inkColor} strokeWidth="2" strokeLinejoin="round" />
      {/* Trifoliate leaflets (compound serrated leaf group) */}
      <circle cx="34" cy="22" r="3" fill="#EFE9D9" stroke={inkColor} strokeWidth="1.5" />
      <circle cx="42" cy="18" r="3" fill="#EFE9D9" stroke={inkColor} strokeWidth="1.5" />
      <circle cx="38" cy="14" r="3" fill="#EFE9D9" stroke={inkColor} strokeWidth="1.5" />
      {/* Lower leaflets */}
      <circle cx="28" cy="38" r="2.5" fill="#EFE9D9" stroke={inkColor} strokeWidth="1.5" />
      <circle cx="49" cy="50" r="2.5" fill="#EFE9D9" stroke={inkColor} strokeWidth="1.5" />
    </svg>
  );
}

export const CROP_LIST = [
  {
    id: 'wheat',
    name: 'Wheat',
    vernacular: 'ਕਣਕ · गेहूं',
    standardDose: '123.6 kg N · 62.5 kg P₂O₅ · 30 kg K₂O / ha',
    source: 'PAU Package of Practices (Rabi, Table 3.2)',
    icon: WheatIcon,
    accent: '#B8791E',
  },
  {
    id: 'barley',
    name: 'Barley',
    vernacular: 'ਜੌਂ · जौ',
    standardDose: '62.5 kg N · 30 kg P₂O₅ · 15 kg K₂O / ha',
    source: 'PAU Package of Practices (Rabi, Table 5.1)',
    icon: BarleyIcon,
    accent: '#B8791E',
  },
  {
    id: 'rice',
    name: 'Rice (Paddy)',
    vernacular: 'ਝੋਨਾ · धान',
    standardDose: '120 kg N · 30 kg P₂O₅ · 30 kg K₂O / ha',
    source: 'PAU Package of Practices (Kharif, Table 2.4)',
    icon: RiceIcon,
    accent: '#B8791E',
  },
  {
    id: 'maize',
    name: 'Maize',
    vernacular: 'ਮੱਕੀ · मक्का',
    standardDose: '125 kg N · 60 kg P₂O₅ · 30 kg K₂O / ha',
    source: 'PAU Package of Practices (Kharif, Table 4.1)',
    icon: MaizeIcon,
    accent: '#B8791E',
  },
  {
    id: 'cotton',
    name: 'Cotton',
    vernacular: 'ਨਰਮਾ · कपास',
    standardDose: '75 kg N · 30 kg P₂O₅ / ha (Bt Hybrid)',
    source: 'PAU Package of Practices (Kharif, Table 6.3)',
    icon: CottonIcon,
    accent: '#33512E',
  },
  {
    id: 'sugarcane',
    name: 'Sugarcane',
    vernacular: 'ਗੰਨਾ · गन्ना',
    standardDose: '150 kg N / ha (Ratoon: 225 kg N)',
    source: 'PAU Package of Practices (Kharif, Table 8.2)',
    icon: SugarcaneIcon,
    accent: '#33512E',
  },
  {
    id: 'chickpea',
    name: 'Chickpea (Gram)',
    vernacular: 'ਛੋਲੇ · चना',
    standardDose: '15 kg N · 40 kg P₂O₅ / ha (Starter Rhizobium)',
    source: 'PAU Package of Practices (Rabi, Table 7.4)',
    icon: ChickpeaIcon,
    accent: '#33512E',
  },
];

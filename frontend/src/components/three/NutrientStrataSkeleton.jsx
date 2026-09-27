import React from 'react'

/**
 * Real skeleton placeholder for Suspense during lazy load
 * Preserves height (380px-440px) to prevent Cumulative Layout Shift (CLS)
 */
export default function NutrientStrataSkeleton() {
  return (
    <div
      className="relative w-full h-[380px] sm:h-[440px] rounded-2xl bg-slate-900/90 border border-slate-800 p-6 flex flex-col justify-between overflow-hidden animate-pulse"
      aria-busy="true"
      aria-label="Loading nutrient core visualization"
    >
      <div className="flex justify-between items-center">
        <div className="h-5 w-40 bg-slate-800 rounded-md" />
        <div className="h-7 w-28 bg-slate-800 rounded-lg" />
      </div>

      <div className="grid grid-cols-3 gap-6 items-end justify-center h-48 px-8">
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-28 bg-emerald-950/60 border border-emerald-800/40 rounded-t-xl" />
          <div className="w-16 h-12 bg-amber-950/40 border border-amber-900/30 rounded-b-xl" />
          <div className="w-12 h-3 bg-slate-800 rounded" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-20 bg-amber-950/60 border border-amber-800/40 rounded-t-xl" />
          <div className="w-16 h-16 bg-amber-950/40 border border-amber-900/30 rounded-b-xl" />
          <div className="w-12 h-3 bg-slate-800 rounded" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-16 h-14 bg-indigo-950/60 border border-indigo-800/40 rounded-t-xl" />
          <div className="w-16 h-14 bg-amber-950/40 border border-amber-900/30 rounded-b-xl" />
          <div className="w-12 h-3 bg-slate-800 rounded" />
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
        <div className="h-4 w-48 bg-slate-800 rounded" />
        <div className="h-4 w-32 bg-slate-800 rounded" />
      </div>
    </div>
  )
}

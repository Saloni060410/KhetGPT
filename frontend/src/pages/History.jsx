import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  FlaskConical,
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import * as endpoints from '../services/endpoints.js';

// Every fertilizer product's schedule entry is snake_case, passed through as-is from the ML
// service (see data/realDocket.js's own note on this same thing) -- summarized here rather
// than rendering the raw keys.
function summarizeSchedule(schedule) {
  if (!schedule || schedule.length === 0) return null;
  const totals = {};
  for (const line of schedule) {
    totals[line.fertilizer_type] = (totals[line.fertilizer_type] || 0) + line.quantity_kg_per_acre;
  }
  return Object.entries(totals)
    .map(([type, qty]) => `${qty.toFixed(1)} kg/acre ${type}`)
    .join(' · ');
}

function formatSaving(saving) {
  if (saving == null) return null;
  return saving >= 0
    ? { text: `₹${Math.abs(saving).toFixed(0)} Saved`, positive: true }
    : { text: `₹${Math.abs(saving).toFixed(0)} More Than Last Applied`, positive: false };
}

export default function History() {
  const { fieldId = '1' } = useParams();
  useDocumentTitle('Season Archive & Soil Ledger — KhetGPT');

  const [entries, setEntries] = useState([]);
  const [field, setField] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const [fieldRes, recsRes, soilRes] = await Promise.all([
          endpoints.getFieldById(fieldId),
          endpoints.getRecommendations(fieldId, { limit: 50 }),
          endpoints.getSoilTests(fieldId, { limit: 50 }),
        ]);
        if (cancelled) return;

        const soilById = new Map((soilRes?.items || []).map((s) => [s.id, s]));
        const recommendations = recsRes?.items || [];

        // Each recommendation already carries its own soilTestId -- joined here to the exact
        // soil test it was actually computed from, not just "whichever one is closest in time".
        const built = recommendations.map((rec) => {
          const soil = soilById.get(rec.soilTestId);
          return {
            id: rec.id,
            createdAt: rec.createdAt,
            crop: rec.cropType,
            variety: rec.cropVariety,
            growthStage: rec.growthStage,
            prescribedApplication:
              summarizeSchedule(rec.schedule) || `${rec.quantityKgPerAcre} kg/acre ${rec.fertilizerType}`,
            soilSummary: soil
              ? `pH ${soil.ph} · OC ${soil.organicCarbon}% · N ${soil.n} · P ${soil.p} · K ${soil.k} kg/ha`
              : null,
            risk: rec.risk,
            saving: formatSaving(rec.estimatedSaving),
            estimatedCost: rec.estimatedCost,
          };
        });

        setField(fieldRes);
        setEntries(built);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [fieldId]);

  // Real aggregates only -- no fabricated "yield" or "3-year improvement" narrative (the
  // schema has no yield field at all; see realDocket.js's own note on the same limitation for
  // Recommendation.jsx). Savings only sums entries that actually have one (a field with no
  // logged prior usage never gets an invented baseline, same rule as the backend itself).
  const totalLogged = entries.length;
  const savingsKnown = entries.filter((e) => e.saving != null);
  const netSaving = savingsKnown.reduce((acc, e) => acc + (e.saving.positive ? 1 : -1) * parseFloat(e.saving.text.replace(/[^\d.]/g, '')), 0);
  const latestRisk = entries[0]?.risk?.level;

  return (
    <div className="space-y-8 font-sans text-[#1C1B18]">

      {/* 1. Header with Staggered Reveal */}
      <div className="animate-reveal flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#756F63] hover:text-[#1C1B18] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Field Operations</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight">
            Season Archive &amp; Soil Ledger
          </h1>
          <p className="text-sm text-[#756F63] mt-1.5">
            {field ? `${field.name} · ${field.areaAcres} Acres` : 'Loading field…'} · {totalLogged} recommendation{totalLogged === 1 ? '' : 's'} logged
          </p>
        </div>

        <Link
          to={`/fields/${fieldId}/soil`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#DCD6C7] hover:border-[#1C1B18] text-[#1C1B18] text-xs font-medium bg-white/80 hover:bg-white transition-all shadow-2xs cursor-pointer self-start sm:self-auto"
        >
          <FlaskConical className="w-3.5 h-3.5 text-[#756F63]" />
          <span>Enter New Soil Test</span>
        </Link>
      </div>

      {isLoading && (
        <div className="text-sm text-[#756F63] py-8 text-center">Loading real history for this field…</div>
      )}

      {!isLoading && loadError && (
        <div className="p-6 rounded-2xl border border-[#D8CEBC] bg-white/70 text-sm text-[#756F63] text-center">
          Could not load this field&apos;s history right now. Try again shortly.
        </div>
      )}

      {!isLoading && !loadError && totalLogged === 0 && (
        <div className="p-8 rounded-2xl border border-[#D8CEBC] bg-white/70 text-center space-y-3">
          <div className="font-serif text-xl text-[#1C1B18]">No soil tests logged yet for this field</div>
          <p className="text-sm text-[#756F63]">
            Enter a soil test and calibrate a fertilizer plan to start this field&apos;s real history.
          </p>
          <Link
            to={`/fields/${fieldId}/soil`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>Enter Soil Test</span>
          </Link>
        </div>
      )}

      {!isLoading && !loadError && totalLogged > 0 && (
        <>
          {/* 2. Lifetime Impact Docket -- real aggregates only */}
          <div className="animate-reveal delay-1 p-6 rounded-2xl border border-[#D8CEBC] bg-white/80 backdrop-blur-xs grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-xs">
            <div>
              <div className="text-xs text-[#756F63] uppercase tracking-wider">Total Logged</div>
              <div className="font-serif text-2xl text-[#1C1B18] mt-1">{totalLogged} Recommendation{totalLogged === 1 ? '' : 's'}</div>
              <div className="text-xs text-[#756F63] mt-0.5">Real calibrations for this field</div>
            </div>

            <div>
              <div className="text-xs text-[#756F63] uppercase tracking-wider">Net Cost Difference</div>
              <div className={`font-serif text-2xl mt-1 ${netSaving >= 0 ? 'text-[#2D5430]' : 'text-[#9E6015]'}`}>
                {savingsKnown.length > 0 ? `₹${Math.abs(netSaving).toFixed(0)} ${netSaving >= 0 ? 'Saved' : 'More'}` : '—'}
              </div>
              <div className="text-xs text-[#756F63] mt-0.5">
                {savingsKnown.length > 0 ? `Across ${savingsKnown.length} logged application${savingsKnown.length === 1 ? '' : 's'}` : 'No prior usage logged yet to compare against'}
              </div>
            </div>

            <div>
              <div className="text-xs text-[#756F63] uppercase tracking-wider">Latest Risk Level</div>
              <div className={`font-serif text-2xl mt-1 ${latestRisk === 'HIGH' ? 'text-[#B91C1C]' : latestRisk === 'MEDIUM' ? 'text-[#9E6015]' : 'text-[#2D5430]'}`}>
                {latestRisk || '—'}
              </div>
              <div className="text-xs text-[#756F63] mt-0.5">From the most recent calibration</div>
            </div>
          </div>

          {/* 3. Season Log Journal Rows -- real recommendations, newest first */}
          <div className="animate-reveal delay-2 space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-[#756F63] px-2">
              Calibration History
            </div>

            <div className="divide-y divide-[#EAE4D5] border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs shadow-xs overflow-hidden">
              {entries.map((item) => (
                <div
                  key={item.id}
                  className="p-5 sm:p-6 hover:bg-[#FAF8F5] transition-colors space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-serif text-xl text-[#1C1B18] capitalize">
                        {item.crop}{item.variety ? ` (${item.variety})` : ''}
                      </span>
                      <span className="text-sm font-medium text-[#756F63]">
                        · {new Date(item.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                      {item.risk?.level && (
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            item.risk.level === 'HIGH'
                              ? 'bg-[#FEE2E2] text-[#B91C1C]'
                              : item.risk.level === 'MEDIUM'
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#DCFCE7] text-[#166534]'
                          }`}
                        >
                          {item.risk.level} Risk
                        </span>
                      )}
                    </div>

                    {item.saving && (
                      <div className={`font-serif text-lg ${item.saving.positive ? 'text-[#2D5430]' : 'text-[#9E6015]'}`}>
                        {item.saving.text}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-[#756F63] block">Prescribed Application:</span>
                      <span className="font-medium text-[#1C1B18]">{item.prescribedApplication}</span>
                    </div>
                    <div>
                      <span className="text-[#756F63] block">Soil Test at Calibration:</span>
                      <span className="font-medium text-[#1C1B18]">{item.soilSummary || 'Not available'}</span>
                    </div>
                    <div>
                      <span className="text-[#756F63] block">Risk Reason:</span>
                      <span className="font-medium text-[#1C1B18]">{item.risk?.reason || '—'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Footer Navigation */}
      <div className="animate-reveal delay-3 flex justify-end pt-2">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <span>Return to Field Operations</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}

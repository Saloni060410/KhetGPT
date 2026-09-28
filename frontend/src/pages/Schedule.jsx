import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Printer,
  Sun,
  FileText,
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import * as endpoints from '../services/endpoints.js';
import { useUserStore } from '../store/useUserStore.js';

function stageLabel(stage) {
  return (stage || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// schedule[].apply_by/timing_note/fertilizer_type/quantity_kg_per_acre are the ML service's own
// snake_case keys, passed through as-is (see data/realDocket.js's own note on this same thing).
// No "Applied ✓" status here -- there's no execution log anywhere in the schema, only a plan,
// so status is computed honestly from apply_by vs today rather than assumed.
function computeStepStatus(applyBy, today) {
  if (!applyBy) return { isDone: false, isCurrent: false, statusText: 'No fixed date for this stage' };
  const applyDate = new Date(`${applyBy}T00:00:00`);
  const diffDays = Math.round((applyDate - today) / 86_400_000);
  if (diffDays < 0) return { isDone: false, isCurrent: true, statusText: `Due since ${applyBy} (overdue)` };
  if (diffDays === 0) return { isDone: false, isCurrent: true, statusText: 'Due today' };
  if (diffDays <= 7) return { isDone: false, isCurrent: true, statusText: `Due ${applyBy}` };
  return { isDone: false, isCurrent: false, statusText: `Scheduled for ${applyBy}` };
}

export default function Schedule() {
  const { fieldId } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Application Schedule — KhetGPT');
  const { user } = useUserStore();

  // Plot switcher -- every field the user owns, across all their farms. Clicking one navigates
  // to that field's own /schedule, which re-runs the fetch below via the changed :fieldId.
  const [plots, setPlots] = useState([]);
  useEffect(() => {
    let cancelled = false;
    async function loadPlots() {
      try {
        const farmsRes = await endpoints.getFarms();
        const withFields = await Promise.all(
          (farmsRes?.items || []).map(async (farm) => {
            const fieldsRes = await endpoints.getFields(farm.id);
            const f = (fieldsRes?.items || [])[0];
            return f ? { farm, field: f } : null;
          }),
        );
        if (!cancelled) setPlots(withFields.filter(Boolean));
      } catch {
        if (!cancelled) setPlots([]);
      }
    }
    loadPlots();
    return () => {
      cancelled = true;
    };
  }, []);

  const [field, setField] = useState(null);
  const [recommendation, setRecommendation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [fertilizerMeta, setFertilizerMeta] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!fieldId) return;
    let cancelled = false;
    async function load() {
      setIsLoading(true);
      setLoadError(false);
      try {
        const [fieldRes, recsRes, fertilizers, weatherRes] = await Promise.all([
          endpoints.getFieldById(fieldId),
          endpoints.getRecommendations(fieldId, { limit: 1 }),
          endpoints.getReferenceFertilizers(),
          endpoints.getFieldWeather(fieldId).catch(() => null),
        ]);
        if (cancelled) return;
        const meta = {};
        for (const f of fertilizers) meta[f.id] = f;
        setFertilizerMeta(meta);
        setField(fieldRes);
        setRecommendation((recsRes?.items || [])[0] || null);
        setWeather(weatherRes);
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

  const handlePrint = () => window.print();

  const schedule = recommendation?.schedule || [];
  const today = new Date();
  const steps = schedule.map((line, i) => {
    const status = computeStepStatus(line.apply_by, today);
    const meta = fertilizerMeta[line.fertilizer_type];
    const productName = meta?.name || line.fertilizer_type;
    const bags = meta?.bag_size_kg && field?.areaAcres
      ? `≈ ${((line.quantity_kg_per_acre * field.areaAcres) / meta.bag_size_kg).toFixed(1)} bags (${meta.bag_size_kg}kg) across ${field.areaAcres} acres`
      : `${line.quantity_kg_per_acre} kg/acre`;
    return {
      key: `${line.stage}-${line.fertilizer_type}-${i}`,
      step: String(i + 1).padStart(2, '0'),
      title: `${stageLabel(line.stage)} — ${productName}`,
      timing: `${line.quantity_kg_per_acre} kg/acre`,
      fertilizers: productName,
      rate: bags,
      instruction: line.timing_note || `Apply at the ${stageLabel(line.stage).toLowerCase()} stage.`,
      ...status,
    };
  });

  // Real dealer-slip totals: every distinct product across the real schedule, summed -- not a
  // fixed 3-line list.
  const productTotals = {};
  for (const line of schedule) {
    productTotals[line.fertilizer_type] = (productTotals[line.fertilizer_type] || 0) + line.quantity_kg_per_acre;
  }

  return (
    <div className="space-y-8 font-sans text-[#1C1B18]">

      {/* Plot switcher -- only meaningful with more than one field, but shown whenever at
          least one real field exists so it's obvious which one this page is about. */}
      {plots.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-reveal">
          {plots.map(({ farm, field: p }, i) => (
            <button
              key={farm.id}
              type="button"
              onClick={() => navigate(`/fields/${p.id}/schedule`)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                p.id === fieldId
                  ? 'bg-[#2D5430] text-white shadow-xs'
                  : 'bg-white border border-[#D8CEBC] text-[#615C52] hover:border-[#1C1B18]'
              }`}
            >
              Plot {String.fromCharCode(65 + i)} · {p.cropType}
            </button>
          ))}
        </div>
      )}

      {/* 1. Header with Staggered Reveal */}
      <div className="animate-reveal flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E8E2D5]">
        <div>
          <Link
            to={`/fields/${fieldId}/recommendation`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#756F63] hover:text-[#1C1B18] transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Prescription Docket</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight">
            Application Schedule &amp; Timeline
          </h1>
          <p className="text-sm text-[#756F63] mt-1.5">
            {field ? `${field.name} · ${field.areaAcres} Acres` : 'Loading field…'}
            {recommendation ? ` · ${recommendation.cropType}` : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 text-xs font-medium text-[#615C52] hover:text-[#1C1B18] border border-[#DCD6C7] rounded-lg bg-white/80 hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs self-start sm:self-auto"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Retailer Purchase Slip</span>
        </button>
      </div>

      {isLoading && (
        <div className="text-sm text-[#756F63] py-8 text-center">Loading this field&apos;s real schedule…</div>
      )}

      {!isLoading && loadError && (
        <div className="p-6 rounded-2xl border border-[#D8CEBC] bg-white/70 text-sm text-[#756F63] text-center">
          Could not load this field&apos;s schedule right now. Try again shortly.
        </div>
      )}

      {!isLoading && !loadError && !recommendation && (
        <div className="p-8 rounded-2xl border border-[#D8CEBC] bg-white/70 text-center space-y-3">
          <div className="font-serif text-xl text-[#1C1B18]">No recommendation calibrated yet for this field</div>
          <p className="text-sm text-[#756F63]">
            Enter a soil test to generate a real application schedule.
          </p>
          <Link
            to={`/fields/${fieldId}/soil`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
          >
            <span>Enter Soil Test</span>
          </Link>
        </div>
      )}

      {!isLoading && !loadError && recommendation && (
        <>
          {/* 2. Distinctive Application Stepper -- real schedule, one row per real line */}
          <div className="animate-reveal delay-1 space-y-3">
            <div className="text-xs font-medium uppercase tracking-wider text-[#756F63] px-2">
              Real Application Schedule ({steps.length} step{steps.length === 1 ? '' : 's'})
            </div>

            <div className="divide-y divide-[#EAE4D5] border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs overflow-hidden shadow-xs">
              {steps.map((item) => (
                <div
                  key={item.key}
                  className={`p-5 sm:p-6 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                    item.isCurrent ? 'bg-[#FAF8F5]' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`font-serif text-2xl shrink-0 font-medium ${
                        item.isCurrent ? 'text-[#B8791E]' : 'text-[#C5BBAA]'
                      }`}
                    >
                      {item.step}
                    </span>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="font-serif text-xl text-[#1C1B18] capitalize">
                          {item.title}
                        </h2>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                            item.isCurrent
                              ? 'bg-[#FEF3C7] text-[#92400E]'
                              : 'bg-[#F4F1EA] text-[#756F63]'
                          }`}
                        >
                          {item.statusText}
                        </span>
                      </div>

                      <div className="text-sm font-semibold text-[#1C1B18]">
                        {item.timing} {item.fertilizers}
                      </div>

                      <div className="text-xs text-[#756F63]">
                        {item.rate}
                      </div>

                      <div className="text-xs text-[#8A8477] pt-1">
                        {item.instruction}
                      </div>
                    </div>
                  </div>

                  {item.isCurrent && weather && (
                    <div className="sm:text-right shrink-0">
                      <span className="inline-flex items-center gap-1.5 text-xs text-[#2D5430] font-medium bg-[#DCFCE7]/70 px-3 py-1 rounded-full">
                        <Sun className="w-3.5 h-3.5" />
                        {weather.rainfallMmForecast}mm rain forecast ({weather.source})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Official Cooperative Dealer Slip (Print-Ready Document) -- real totals */}
          <div className="animate-reveal delay-2 border border-[#D8CEBC] rounded-2xl bg-white p-6 sm:p-8 space-y-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D5]">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#2D5430]" />
                <div>
                  <span className="font-serif text-xl text-[#1C1B18] block leading-tight">
                    Fertilizer Dealer Purchase Slip
                  </span>
                  <span className="text-xs text-[#756F63]">
                    ਖਾਦ ਖਰੀਦ ਪਰਚੀ · IFFCO / Cooperative Society
                  </span>
                </div>
              </div>
              <span className="text-xs text-[#2D5430] font-medium bg-[#DCFCE7] px-2.5 py-1 rounded-full hidden sm:inline">
                PAU Package of Practices
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs pb-4 border-b border-[#E8E2D5]">
              <div>
                <div className="text-[#756F63]">Farmer Name</div>
                <div className="font-semibold text-sm text-[#1C1B18] mt-0.5">{user?.name || '—'}</div>
              </div>
              <div>
                <div className="text-[#756F63]">Field Plot &amp; Area</div>
                <div className="font-semibold text-sm text-[#1C1B18] mt-0.5">{field ? `${field.name} (${field.areaAcres} Acres)` : '—'}</div>
              </div>
              <div>
                <div className="text-[#756F63]">Target Crop</div>
                <div className="font-semibold text-sm text-[#1C1B18] mt-0.5 capitalize">{recommendation.cropType}</div>
              </div>
              <div>
                <div className="text-[#756F63]">Est. Cost</div>
                <div className="font-serif text-lg font-bold text-[#2D5430] mt-0.5">
                  {recommendation.estimatedCost != null ? `₹${recommendation.estimatedCost.toFixed(0)}/acre` : '—'}
                </div>
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              {Object.entries(productTotals).map(([productId, qty], i) => {
                const meta = fertilizerMeta[productId];
                return (
                  <div key={productId} className="flex justify-between py-1.5 border-b border-[#F4F1EA] last:border-b-0">
                    <span className="text-[#4A463D] font-medium">{i + 1}. {meta?.name || productId}</span>
                    <span className="font-semibold text-[#1C1B18]">
                      {qty.toFixed(1)} kg/acre
                      {meta?.bag_size_kg && field?.areaAcres
                        ? ` (≈ ${((qty * field.areaAcres) / meta.bag_size_kg).toFixed(1)} bags)`
                        : ''}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#E8E2D5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#756F63]">
              <span>Certified under Punjab Agricultural University Package of Practices.</span>
              <button
                type="button"
                onClick={handlePrint}
                className="text-[#2D5430] font-semibold hover:underline cursor-pointer"
              >
                Click here to print slip
              </button>
            </div>
          </div>
        </>
      )}

      {/* Footer Navigation */}
      <div className="animate-reveal delay-3 flex justify-end pt-2">
        <Link
          to={`/fields/${fieldId}/history`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <span>View Past Season Records</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
}

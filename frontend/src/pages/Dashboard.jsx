import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Sun,
  X,
  ArrowRight,
  Printer,
  Trash2
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import { useFarmStore } from '../store/useFarmStore.js';
import * as endpoints from '../services/endpoints.js';

// Demo region default (Ludhiana, Punjab) -- matches the coordinates the rest of this project
// (seed data, ML demo scenarios) already uses. A real location picker is a separate feature;
// every new plot gets real live weather for this fixed point until one exists.
const DEFAULT_LAT = 30.901;
const DEFAULT_LON = 75.8573;

// Presentational-only flavor text (variety name, growth-stage label, next-action copy) --
// there's no backend field for any of this, only a real cropType id. Keeps the same look the
// static demo had, now driven by the crop actually registered instead of a fixed string.
function flavorFor(crop) {
  const c = (crop || '').toLowerCase();
  return {
    variety:
      c === 'wheat' ? 'PBW 824 (ਕਣਕ · गेहूं)' :
      c === 'barley' ? 'PL 891 / DWRB 123 (ਜੌਂ · जौ)' :
      c === 'rice' ? 'PR 126 / Pusa 1121 (ਝੋਨਾ · धान)' :
      c === 'maize' ? 'PMH 13 / DKC 9108 (ਮੱਕੀ · मक्का)' :
      c === 'cotton' ? 'Bt Cotton RCH 659 (ਨਰਮਾ · कपास)' :
      c === 'sugarcane' ? 'CoJ 88 / CoPb 96 (ਗੰਨਾ · गन्ना)' :
      c === 'chickpea' ? 'PBG 8 / GPF 2 (ਛੋਲੇ · चना)' : 'Hybrid Variety',
    stage:
      c === 'wheat' ? 'Crown Root Stage (Day 28)' :
      c === 'barley' ? 'Tillering Stage (Day 30)' :
      c === 'rice' ? 'Active Tillering (Day 35)' :
      c === 'maize' ? 'Knee-High Stage (Day 30)' :
      c === 'cotton' ? 'Early Vegetative (Day 42)' :
      c === 'sugarcane' ? 'Formative Phase (Day 60)' :
      c === 'chickpea' ? 'Branching / Pre-Flowering (Day 40)' : 'Vegetative Stage (Day 25)',
    nextAction:
      c === 'wheat' ? '10 Bags Urea Due' :
      c === 'barley' ? '4 Bags Urea Due with Irrigation' :
      c === 'rice' ? '4 Bags Urea Due' :
      c === 'maize' ? '3 Bags Urea Side-Dress Due' :
      c === 'cotton' ? 'Basal Done · 5 Bags Urea in 14 days' :
      c === 'sugarcane' ? 'Top-Dress 6 Bags Urea + Earthing Up' :
      c === 'chickpea' ? 'Foliar Spray 2% Urea / DAP at Podding' : '1.0 Bag Urea/Acre Scheduled',
    timing:
      c === 'barley' ? 'Apply with first nodal irrigation' :
      c === 'chickpea' ? 'Apply in evening before light irrigation' :
      c === 'sugarcane' ? 'Broadcast along furrows before watering' :
      'University benchmark timing',
    isActionDue: c === 'wheat' || c === 'rice' || c === 'barley' || c === 'sugarcane',
  };
}

export default function Dashboard() {
  useDocumentTitle('Field Operations Ledger — KhetGPT');
  const navigate = useNavigate();
  const { fetchFarms, createFarm, createField, deleteFarm } = useFarmStore();

  const [plots, setPlots] = useState([]);
  const [crops, setCrops] = useState([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');
  const [newCrop, setNewCrop] = useState('');
  const [newAcres, setNewAcres] = useState('5.0');

  // Every farm here has exactly one field, by this app's own "Register Plot" convention below
  // -- a real multi-field-per-farm UI is a bigger feature than this wiring pass covers.
  async function loadPlots() {
    try {
      const fetchedFarms = await fetchFarms();
      const withFields = await Promise.all(
        fetchedFarms.map(async (farm) => {
          const res = await endpoints.getFields(farm.id);
          const fields = res?.items || (Array.isArray(res) ? res : []);
          return fields[0] ? { farm, field: fields[0] } : null;
        })
      );
      setPlots(withFields.filter(Boolean));
    } catch {
      // Degrades to an empty ledger rather than blocking the page -- same as the rest of this
      // app's "never hard-fail on a fetch" convention (see weather/reference proxying).
      setPlots([]);
    }
  }

  useEffect(() => {
    // Fetch-on-mount, the same shape as useFarmStore/useRecommendationStore's own actions
    // (which the linter doesn't flag only because it can't see the setState inside an
    // imported function) -- these two are local, so visible to the same check.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlots();
    async function loadCrops() {
      try {
        const list = await endpoints.getReferenceCrops();
        setCrops(list);
        if (list[0]) setNewCrop(list[0].id);
      } catch {
        // Reference data unavailable -- Register Plot's crop dropdown stays empty rather
        // than blocking the rest of the page.
      }
    }
    loadCrops();
  }, []);

  const totalAcres = plots.reduce((acc, p) => acc + (p.field.areaAcres || 0), 0);
  const cropName = (id) => crops.find((c) => c.id === id)?.name_en || id;

  const handleAddPlot = async (e) => {
    e.preventDefault();
    if (!newPlotName.trim() || !newCrop) return;

    try {
      const farm = await createFarm({ name: newPlotName.trim() });
      const field = await createField(farm.id, {
        name: newPlotName.trim(),
        areaAcres: parseFloat(newAcres) || 1,
        latitude: DEFAULT_LAT,
        longitude: DEFAULT_LON,
        cropType: newCrop,
        growthStage: 'sowing',
        irrigation: 'irrigated',
      });
      setPlots([...plots, { farm, field }]);
      setIsAddOpen(false);
      setNewPlotName('');
    } catch {
      // The modal stays open with the entered values so the farmer can retry -- no silent
      // "looked like it worked" state when the plot was never actually registered.
    }
  };

  const handleDelete = async (farmId) => {
    if (plots.length <= 1) return;
    setPlots(plots.filter((p) => p.farm.id !== farmId));
    try {
      await deleteFarm(farmId);
    } catch {
      loadPlots(); // rollback the optimistic removal if the server call failed
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#1C1B18]">

      {/* 1. High-Impact Page Header with Staggered Reveal */}
      <div className="animate-reveal flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E8E2D5]">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#B8791E] mb-1">
            ਪੰਜਾਬ ਖੇਤੀ ਲੇਜ਼ਰ · Punjab Agromet Portal
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight">
            Field Operations Ledger
          </h1>
          <p className="text-sm text-[#756F63] mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>{plots.length} Registered Plots</span>
            <span className="text-[#C5BBAA]">·</span>
            <span>{totalAcres.toFixed(1)} Total Acres</span>
            <span className="text-[#C5BBAA]">·</span>
            <span className="inline-flex items-center gap-1.5 text-[#2D5430] font-medium bg-[#DCFCE7]/70 px-2.5 py-0.5 rounded-full text-xs">
              <Sun className="w-3.5 h-3.5" />
              Weather Window Clear (0.0mm rain next 48h)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 text-xs font-medium text-[#615C52] hover:text-[#1C1B18] border border-[#DCD6C7] rounded-lg bg-white/80 hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dealer Slip</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2 text-xs font-medium text-white bg-[#2D5430] hover:bg-[#234226] rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Register Plot</span>
          </button>
        </div>
      </div>

      {/* 2. Bespoke Operations Ledger (Clean tabular list with craft detailing) */}
      <div className="space-y-3 animate-reveal delay-1">
        <div className="flex items-center justify-between text-xs font-medium text-[#756F63] uppercase tracking-wider px-2">
          <span>Field Specification</span>
          <span className="hidden md:inline">Prescribed Action &amp; Weather</span>
        </div>

        <div className="border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs divide-y divide-[#EAE4D5] shadow-xs overflow-hidden">
          {plots.map(({ farm, field }, i) => {
            const flavor = flavorFor(field.cropType);
            return (
            <div
              key={farm.id}
              className="p-5 sm:p-6 hover:bg-[#FAF8F5] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left: Serial & Field Details */}
              <div className="flex items-start gap-4">
                <span className="font-serif text-2xl text-[#B8791E] shrink-0 font-medium">
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-serif text-xl text-[#1C1B18]">
                      {farm.name}
                    </h2>
                    <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-[#F0EADB] text-[#615C52]">
                      Plot {String.fromCharCode(65 + i)}
                    </span>
                  </div>

                  <div className="text-sm text-[#756F63]">
                    <span className="font-semibold text-[#1C1B18]">{cropName(field.cropType)}</span> · {flavor.variety} · <span className="font-medium text-[#1C1B18]">{field.areaAcres} Acres</span>
                  </div>

                  <div className="text-xs text-[#8A8477]">
                    Growth Stage: {flavor.stage}
                  </div>
                </div>
              </div>

              {/* Right: Prescribed Dose & Direct Action */}
              <div className="flex flex-col sm:flex-row md:flex-col md:items-end justify-between sm:items-center gap-3">
                <div className="md:text-right">
                  <div className={`font-serif text-lg ${flavor.isActionDue ? 'text-[#9E6015]' : 'text-[#2D5430]'}`}>
                    {flavor.nextAction}
                  </div>
                  <div className="text-xs text-[#756F63]">
                    {flavor.timing}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-[#2D5430] flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D5430]" />
                    Clear sunny conditions
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate(`/fields/${field.id}/recommendation`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <span>View Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {plots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(farm.id)}
                      className="p-1.5 text-[#A39E93] hover:text-[#B91C1C] rounded-md transition-colors cursor-pointer"
                      title="Remove plot entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* 3. Soil Calibration Quick Callout (Clean Editorial Docket) */}
      <div className="animate-reveal delay-2 p-6 rounded-2xl border border-[#D8CEBC] bg-white/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="font-serif text-lg text-[#1C1B18]">
            Recalibrate Doses with Recent Soil Test
          </div>
          <div className="text-sm text-[#756F63]">
            Adjust exact fertilizer bag counts based on your latest Punjab government soil health card.
          </div>
        </div>

        <Link
          to={`/fields/${plots[0]?.field.id || '1'}/soil`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#FAF8F5] border border-[#D8CEBC] hover:border-[#1C1B18] text-xs font-medium text-[#1C1B18] transition-all self-start sm:self-auto cursor-pointer shadow-2xs"
        >
          <span>Enter Soil Values</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Add Plot Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] rounded-2xl border border-[#D8CEBC] max-w-md w-full p-6 shadow-2xl space-y-5 animate-reveal">
            <div className="flex items-center justify-between border-b border-[#E8E2D5] pb-3">
              <h2 className="font-serif text-2xl text-[#1C1B18]">
                Register New Field Plot
              </h2>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-md text-[#756F63] hover:text-[#1C1B18]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddPlot} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#615C52] mb-1">
                  Plot Designation
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Canal Block North"
                  value={newPlotName}
                  onChange={(e) => setNewPlotName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#D8CEBC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#615C52] mb-1">
                    Target Crop
                  </label>
                  <select
                    value={newCrop}
                    onChange={(e) => setNewCrop(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#D8CEBC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430]"
                  >
                    {crops.map((c) => (
                      <option key={c.id} value={c.id}>{c.name_en}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#615C52] mb-1">
                    Land Area (Acres)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="100"
                    required
                    value={newAcres}
                    onChange={(e) => setNewAcres(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#D8CEBC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E8E2D5]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#615C52] hover:text-[#1C1B18] rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-[#2D5430] hover:bg-[#234226] rounded-lg transition-colors shadow-xs"
                >
                  Register Plot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

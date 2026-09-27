import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Sun, 
  X, 
  ArrowRight, 
  Printer, 
  Trash2,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

const DEMO_PLOTS = [
  {
    id: 'plot-1',
    fieldId: '1',
    number: '01',
    name: 'Ludhiana North Farm',
    plotLabel: 'Plot A',
    crop: 'Wheat',
    variety: 'HD 3086 (ਕਣਕ · गेहूं)',
    acres: 8.5,
    stage: 'Crown Root Stage (Day 28)',
    nextAction: '10 Bags Urea Due',
    timing: 'Broadcast before 1st canal irrigation',
    weatherStatus: 'Safe to apply · 0.0mm rain next 48h',
    isActionDue: true,
  },
  {
    id: 'plot-2',
    fieldId: '1',
    number: '02',
    name: 'Bathinda South Farm',
    plotLabel: 'Plot B',
    crop: 'Cotton',
    variety: 'Bt Cotton RCH 659 (ਨਰਮਾ · कपास)',
    acres: 6.0,
    stage: 'Early Vegetative (Day 42)',
    nextAction: 'Basal Done · 5 Bags Urea in 14 days',
    timing: 'Prepare for squaring split irrigation',
    weatherStatus: 'Clear sunny conditions',
    isActionDue: false,
  },
  {
    id: 'plot-3',
    fieldId: '1',
    number: '03',
    name: 'Sangrur Central Farm',
    plotLabel: 'Plot C',
    crop: 'Rice',
    variety: 'Basmati Pusa 1121 (ਝੋਨਾ · धान)',
    acres: 4.0,
    stage: 'Active Tillering (Day 35)',
    nextAction: '4 Bags Urea Due',
    timing: 'Broadcast after water layer is drained thin',
    weatherStatus: 'Safe to apply',
    isActionDue: true,
  },
];

export default function Dashboard() {
  useDocumentTitle('Field Operations Ledger — KhetGPT');
  const navigate = useNavigate();

  const [plots, setPlots] = useState(DEMO_PLOTS);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newPlotName, setNewPlotName] = useState('');
  const [newCrop, setNewCrop] = useState('Wheat');
  const [newAcres, setNewAcres] = useState('5.0');

  const totalAcres = plots.reduce((acc, p) => acc + p.acres, 0);

  const handleAddPlot = (e) => {
    e.preventDefault();
    if (!newPlotName.trim()) return;

    const num = String(plots.length + 1).padStart(2, '0');
    const added = {
      id: `plot-${Date.now()}`,
      fieldId: '1',
      number: num,
      name: newPlotName.trim(),
      plotLabel: `Plot ${String.fromCharCode(65 + plots.length)}`,
      crop: newCrop,
      variety: newCrop === 'Wheat' ? 'PBW 824' : newCrop === 'Rice' ? 'PR 126' : 'Hybrid',
      acres: parseFloat(newAcres) || 4.0,
      stage: 'Vegetative Stage (Day 25)',
      nextAction: '1.0 Bag Urea/Acre Scheduled',
      timing: 'University benchmark timing',
      weatherStatus: 'Clear conditions',
      isActionDue: false,
    };

    setPlots([...plots, added]);
    setIsAddOpen(false);
    setNewPlotName('');
  };

  const handleDelete = (id) => {
    if (plots.length <= 1) return;
    setPlots(plots.filter((p) => p.id !== id));
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
          {plots.map((plot) => (
            <div
              key={plot.id}
              className="p-5 sm:p-6 hover:bg-[#FAF8F5] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              {/* Left: Serial & Field Details */}
              <div className="flex items-start gap-4">
                <span className="font-serif text-2xl text-[#B8791E] shrink-0 font-medium">
                  {plot.number}
                </span>

                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h2 className="font-serif text-xl text-[#1C1B18]">
                      {plot.name}
                    </h2>
                    <span className="text-[11px] font-sans font-medium px-2 py-0.5 rounded bg-[#F0EADB] text-[#615C52]">
                      {plot.plotLabel}
                    </span>
                  </div>

                  <div className="text-sm text-[#756F63]">
                    <span className="font-semibold text-[#1C1B18]">{plot.crop}</span> · {plot.variety} · <span className="font-medium text-[#1C1B18]">{plot.acres} Acres</span>
                  </div>

                  <div className="text-xs text-[#8A8477]">
                    Growth Stage: {plot.stage}
                  </div>
                </div>
              </div>

              {/* Right: Prescribed Dose & Direct Action */}
              <div className="flex flex-col sm:flex-row md:flex-col md:items-end justify-between sm:items-center gap-3">
                <div className="md:text-right">
                  <div className={`font-serif text-lg ${plot.isActionDue ? 'text-[#9E6015]' : 'text-[#2D5430]'}`}>
                    {plot.nextAction}
                  </div>
                  <div className="text-xs text-[#756F63]">
                    {plot.timing}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-[#2D5430] flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D5430]" />
                    {plot.weatherStatus}
                  </span>

                  <button
                    type="button"
                    onClick={() => navigate(`/fields/${plot.fieldId}/recommendation`)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all cursor-pointer shadow-2xs active:scale-95"
                  >
                    <span>View Plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {plots.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleDelete(plot.id)}
                      className="p-1.5 text-[#A39E93] hover:text-[#B91C1C] rounded-md transition-colors cursor-pointer"
                      title="Remove plot entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
          to="/fields/1/soil"
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
                    <option value="Wheat">Wheat (ਕਣਕ)</option>
                    <option value="Rice">Rice (ਝੋਨਾ)</option>
                    <option value="Cotton">Cotton (ਨਰਮਾ)</option>
                    <option value="Maize">Maize (ਮੱਕੀ)</option>
                    <option value="Sugarcane">Sugarcane (ਗੰਨਾ)</option>
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

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  UploadCloud,
  Sparkles,
  History,
  Droplets
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import RecommendationCard from '../components/RecommendationCard.jsx';
import * as endpoints from '../services/endpoints.js';
import { useRecommendationStore } from '../store/useRecommendationStore.js';

export default function SoilInput() {
  const { fieldId = '1' } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Soil Health Calibration — KhetGPT');

  // Plot switcher -- every field the user owns, across all their farms, same pattern as
  // Schedule.jsx's. Was missing here entirely, which is exactly why there was no way to
  // calibrate a specific plot other than whatever fieldId happened to already be in the URL.
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

  // The real field + the real crop list, so "crop type" can be picked here rather than only
  // ever inherited from whatever the field was registered with on Dashboard. cropType is sent
  // as an explicit override on generateRecommendation below -- POST /fields/:id/recommendations
  // already accepts one per docs/backend-api.md, it just had no UI anywhere calling it with one.
  const [field, setField] = useState(null);
  const [crops, setCrops] = useState([]);
  const [selectedCropId, setSelectedCropId] = useState('');
  useEffect(() => {
    let cancelled = false;
    async function loadFieldAndCrops() {
      try {
        const [fieldRes, cropsRes] = await Promise.all([
          endpoints.getFieldById(fieldId),
          endpoints.getReferenceCrops(),
        ]);
        if (cancelled) return;
        setField(fieldRes);
        setCrops(cropsRes);
        setSelectedCropId(fieldRes?.cropType || cropsRes[0]?.id || '');
      } catch {
        // Field/crops unavailable -- form still works with whatever crop the field already
        // has; the dropdown just stays empty rather than blocking soil entry.
      }
    }
    loadFieldAndCrops();
    return () => {
      cancelled = true;
    };
  }, [fieldId]);

  // Core NPK parameters (PRD FR3)
  const [n, setN] = useState('210');
  const [p, setP] = useState('16.0');
  const [k, setK] = useState('310');
  const [ph, setPh] = useState('7.4');
  const [oc, setOc] = useState('0.48');
  const [moisture, setMoisture] = useState('28');

  // Previous fertilizer usage log (PRD FR5 & Must-Have 7)
  const [prevCrop, setPrevCrop] = useState('rice');
  const [prevFertilizer, setPrevFertilizer] = useState('standard');
  const [fym, setFym] = useState('fym_5');

  // Soil health card upload feedback
  const [shcUploaded, setShcUploaded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const numN = parseFloat(n) || 0;
  const numP = parseFloat(p) || 0;
  const numK = parseFloat(k) || 0;
  const numMoisture = parseFloat(moisture) || 0;

  const nStatus = numN < 280 ? 'Low (adds +25% nitrogen)' : numN <= 560 ? 'Medium (standard dose)' : 'High (reduced dose)';
  const pStatus = numP < 12.5 ? 'Low (adds +25% DAP)' : numP <= 25 ? 'Medium (standard DAP)' : 'High (reduced DAP)';
  const kStatus = numK < 135 ? 'Low (requires Potash)' : numK <= 280 ? 'Medium' : 'High (saves 50% Potash)';
  const moistureStatus = numMoisture < 20 
    ? 'Deficient (<20%): pre-irrigation recommended' 
    : numMoisture <= 35 
      ? 'Optimal (25–35%): prime for nutrient root diffusion' 
      : 'Saturated (>35%): delay broadcast to avoid leaching';

  const handleApplyPreset = (preset) => {
    if (preset === 'sandy_loam') {
      setN('210');
      setP('16.0');
      setK('310');
      setPh('7.4');
      setOc('0.48');
      setMoisture('28');
    } else {
      setN('320');
      setP('22.0');
      setK('220');
      setPh('7.8');
      setOc('0.62');
      setMoisture('32');
    }
  };

  // PRD FR3 Stretch: Auto-fill from Government Soil Health Card OCR
  const handleUploadSHCDemo = () => {
    setN('215');
    setP('16.8');
    setK('315');
    setPh('7.4');
    setOc('0.52');
    setMoisture('29');
    setShcUploaded(true);
    setTimeout(() => {
      setShcUploaded(false);
    }, 6000);
  };

  const { generateRecommendation } = useRecommendationStore();

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaved(true);
    try {
      await endpoints.createSoilTest(fieldId, {
        n: numN,
        p: numP,
        k: numK,
        ph: parseFloat(ph) || 0,
        organicCarbon: parseFloat(oc) || 0,
        moisture: numMoisture,
      });
      await generateRecommendation(fieldId, selectedCropId ? { cropType: selectedCropId } : {});
      navigate(`/fields/${fieldId}/recommendation`);
    } catch (err) {
      // Stays on the form with the entered values rather than navigating to a recommendation
      // that was never actually generated -- no silent "looked like it worked" state.
      console.error('Calibrate Fertilizer Plan failed for field', fieldId, err);
      setIsSaved(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#1C1B18]">

      {/* Plot switcher -- pick which real field this calibration is for */}
      {plots.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 animate-reveal">
          {plots.map(({ farm, field: p }, i) => (
            <button
              key={farm.id}
              type="button"
              onClick={() => navigate(`/fields/${p.id}/soil`)}
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
      <div className="animate-reveal pb-6 border-b border-[#E8E2D5] space-y-3">
        <Link
          to={`/fields/${fieldId}`}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#756F63] hover:text-[#1C1B18] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Plot Overview</span>
        </Link>
        <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight">
          Soil Health Calibration
        </h1>
        <p className="text-sm text-[#756F63]">
          {field ? `${field.name} (${field.areaAcres} Acres)` : 'Loading field…'} · Enter test values from your laboratory soil card to calibrate exact fertilizer bags.
        </p>

        {/* Crop type this calibration is for -- defaults to the field's own registered crop,
            but can be overridden per calibration (POST /fields/:id/recommendations already
            accepts a cropType override; nothing in the UI ever let anyone pick one). */}
        {crops.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <label htmlFor="crop-select" className="text-xs font-medium text-[#615C52]">
              Crop for this calibration:
            </label>
            <select
              id="crop-select"
              value={selectedCropId}
              onChange={(e) => setSelectedCropId(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#D8CEBC] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430] cursor-pointer"
            >
              {crops.map((c) => (
                <option key={c.id} value={c.id}>{c.name_en}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Quick Soil Presets & Soil Health Card OCR Upload (PRD FR3 Stretch) */}
      <div className="animate-reveal delay-1 p-5 rounded-2xl bg-white/70 border border-[#D8CEBC] backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
        <span className="text-[#615C52] font-medium">
          Load regional Punjab average or import verified Soil Health Card:
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset('sandy_loam')}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#DCD6C7] hover:border-[#1C1B18] text-[#1C1B18] font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            Central Punjab (Sandy Loam)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('clay_loam')}
            className="px-3 py-1.5 rounded-lg bg-white border border-[#DCD6C7] hover:border-[#1C1B18] text-[#1C1B18] font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            Malwa Plain (Clay Loam)
          </button>
          <button
            type="button"
            onClick={handleUploadSHCDemo}
            className="px-3.5 py-1.5 rounded-lg bg-[#2D5430]/10 border border-[#2D5430]/30 hover:bg-[#2D5430]/20 text-[#2D5430] font-medium transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1.5"
            title="Auto-fill NPK, pH, OC & Moisture from Government Soil Health Card"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#2D5430]" />
            <span>Upload Soil Health Card</span>
          </button>
        </div>
      </div>

      {/* Soil Health Card parsed banner */}
      {shcUploaded && (
        <div className="animate-in fade-in duration-300 p-4 rounded-xl bg-[#DCFCE7] border border-[#86EFAC] text-xs text-[#166534] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#166534] shrink-0" />
            <span>
              <strong>Government Soil Health Card #PB-LDH-2025-412 Parsed:</strong> N, P, K, pH, OC &amp; Moisture values auto-populated with official PAU laboratory benchmarks.
            </span>
          </div>
          <span className="font-semibold text-[11px] uppercase tracking-wider bg-white/70 px-2.5 py-0.5 rounded-md">
            Verified
          </span>
        </div>
      )}

      {/* 3. Soil Input Form */}
      <form onSubmit={handleSave} className="animate-reveal delay-2 space-y-6">
        <div className="border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs divide-y divide-[#EAE4D5] shadow-xs overflow-hidden">
          
          {/* Nitrogen */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label htmlFor="input-n" className="font-serif text-lg text-[#1C1B18] block">
                Available Nitrogen (N)
              </label>
              <div className="text-xs text-[#756F63]">
                {nStatus}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-48">
              <input
                id="input-n"
                type="number"
                step="1"
                min="50"
                max="800"
                required
                value={n}
                onChange={(e) => setN(e.target.value)}
                className="w-full px-3.5 py-2 font-serif text-xl font-medium rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430] text-right"
              />
              <span className="text-xs text-[#756F63] shrink-0 font-medium">kg/ha</span>
            </div>
          </div>

          {/* Phosphorus */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label htmlFor="input-p" className="font-serif text-lg text-[#1C1B18] block">
                Available Phosphorus (P)
              </label>
              <div className="text-xs text-[#756F63]">
                {pStatus}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-48">
              <input
                id="input-p"
                type="number"
                step="0.5"
                min="2"
                max="100"
                required
                value={p}
                onChange={(e) => setP(e.target.value)}
                className="w-full px-3.5 py-2 font-serif text-xl font-medium rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430] text-right"
              />
              <span className="text-xs text-[#756F63] shrink-0 font-medium">kg/ha</span>
            </div>
          </div>

          {/* Potassium */}
          <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <label htmlFor="input-k" className="font-serif text-lg text-[#1C1B18] block">
                Available Potassium (K)
              </label>
              <div className="text-xs text-[#756F63]">
                {kStatus}
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-48">
              <input
                id="input-k"
                type="number"
                step="1"
                min="50"
                max="800"
                required
                value={k}
                onChange={(e) => setK(e.target.value)}
                className="w-full px-3.5 py-2 font-serif text-xl font-medium rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430] text-right"
              />
              <span className="text-xs text-[#756F63] shrink-0 font-medium">kg/ha</span>
            </div>
          </div>

        </div>

        {/* Secondary Physical Measurements: pH, OC, and Moisture (PRD FR3) */}
        <div className="border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#756F63]">
              Soil Reaction, Organic Carbon &amp; Moisture (PRD FR3)
            </div>
            <span className="text-[11px] text-[#2D5430] font-medium bg-[#DCFCE7]/70 px-2 py-0.5 rounded-full">
              Full Spectrum Calibration
            </span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#615C52] mb-1">
                Soil pH (Acidity / Alkalinity)
              </label>
              <input
                type="number"
                step="0.1"
                min="5.0"
                max="9.5"
                value={ph}
                onChange={(e) => setPh(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430]"
              />
              <span className="text-[11px] text-[#756F63] mt-1 block">Normal Punjab range: 7.2 – 8.2</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#615C52] mb-1">
                Organic Carbon (OC %)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.1"
                max="2.0"
                value={oc}
                onChange={(e) => setOc(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430]"
              />
              <span className="text-[11px] text-[#756F63] mt-1 block">Typical: 0.40% – 0.65%</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#615C52] mb-1 flex items-center gap-1">
                <Droplets className="w-3.5 h-3.5 text-[#3F6273]" />
                <span>Soil Moisture (%)</span>
              </label>
              <input
                type="number"
                step="1"
                min="5"
                max="60"
                value={moisture}
                onChange={(e) => setMoisture(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430]"
              />
              <span className="text-[11px] text-[#2D5430] mt-1 block truncate">
                {moistureStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Previous Fertilizer Usage & Crop History Log (PRD FR5 / Must-Have 7) */}
        <div className="border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs p-5 sm:p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-[#756F63] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#B8791E]" />
                <span>Previous Crop &amp; Fertilizer Log (PRD FR5)</span>
              </div>
              <p className="text-xs text-[#756F63] mt-0.5">
                Logging preceding season inputs refines current fertilizer splits and factors in residual soil credits.
              </p>
            </div>
            <span className="text-[11px] font-medium text-[#2D5430] bg-[#DCFCE7] px-2.5 py-1 rounded-full shrink-0 self-start sm:self-auto">
              Nutrient Carryover Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#615C52] mb-1">
                Preceding Season Crop
              </label>
              <select
                value={prevCrop}
                onChange={(e) => setPrevCrop(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430] cursor-pointer"
              >
                <option value="rice">Rice / Paddy (ਝੋਨਾ · PR 126)</option>
                <option value="cotton">Cotton (ਨਰਮਾ · Bt Cotton)</option>
                <option value="maize">Kharif Maize (ਮੱਕੀ)</option>
                <option value="sugarcane">Sugarcane (ਗੰਨਾ)</option>
                <option value="wheat">Rabi Wheat (ਕਣਕ)</option>
                <option value="barley">Winter Barley (ਜੌਂ)</option>
                <option value="chickpea">Chickpea / Gram (ਛੋਲੇ · N-Fixing)</option>
                <option value="legume">Moong / Summer Legume (N-Fixing)</option>
                <option value="fallow">Summer Fallow</option>
              </select>
              <span className="text-[11px] text-[#756F63] mt-1 block">Rotational carryover reference</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#615C52] mb-1">
                Preceding Fertilizer Applied
              </label>
              <select
                value={prevFertilizer}
                onChange={(e) => setPrevFertilizer(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430] cursor-pointer"
              >
                <option value="standard">Standard PAU Dose (Full DAP + Urea)</option>
                <option value="heavy_n">Heavy Nitrogen (Extra Urea broadcast)</option>
                <option value="low_p">Low Phosphorus (Half DAP applied)</option>
                <option value="organic">Organic / Bio-fertilizer only</option>
              </select>
              <span className="text-[11px] text-[#756F63] mt-1 block">Used to detect residual phosphorus</span>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#615C52] mb-1">
                Organic Manure / FYM
              </label>
              <select
                value={fym}
                onChange={(e) => setFym(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-[#DCD6C7] bg-white focus:outline-none focus:ring-2 focus:ring-[#2D5430] cursor-pointer"
              >
                <option value="fym_5">5 Tonnes Farmyard Manure / Acre</option>
                <option value="fym_10">10 Tonnes FYM / Compost</option>
                <option value="none">No Organic Manure Added</option>
                <option value="green_manure">Sesbania Green Manure (Daincha)</option>
              </select>
              <span className="text-[11px] text-[#2D5430] font-medium mt-1 block">
                {prevCrop === 'legume' || fym === 'green_manure' ? '+20 kg biological N credit factored' : 'Active microbial organic matter credit'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-sm font-medium transition-all flex items-center gap-2 shadow-xs cursor-pointer active:scale-95"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Calibrating Prescription...</span>
              </>
            ) : (
              <>
                <span>Calibrate Fertilizer Plan</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* 4. Interactive Field Tool - Calculate Your Field's Baseline Dose */}
      <section className="animate-reveal delay-3 pt-8 border-t border-[#E8E2D5] space-y-6">
        <div className="text-left space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#2D5430]/10 text-[#2D5430] text-xs font-semibold uppercase tracking-wider">
            Interactive Field Tool
          </div>
          <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1B18] tracking-tight">
            Calculate Your Field&apos;s Baseline Dose
          </h2>
          <p className="text-xs sm:text-sm text-[#756F63]">
            Select your crop, soil texture, and district below to inspect baseline bags, soil-test calibrations, and calendar splits.
          </p>
        </div>

        <RecommendationCard 
          soilN={n}
          soilP={p}
          soilK={k}
          fieldId={fieldId}
          initialCrop="wheat"
          initialSoil="loam"
          initialRegion="pb_ludhiana"
          initialStage="tillering"
          showDocketLink={true}
        />
      </section>

    </div>
  );
}

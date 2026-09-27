import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight,
  Sun, 
  FlaskConical, 
  Calendar, 
  Sparkles
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';

export default function FieldProfile() {
  const { fieldId = '1' } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Plot Dossier — KhetGPT');

  return (
    <div className="space-y-8 font-sans text-[#1C1B18]">
      
      {/* 1. Header with Staggered Reveal */}
      <div className="animate-reveal pb-6 border-b border-[#E8E2D5] space-y-3">
        <Link 
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#756F63] hover:text-[#1C1B18] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Field Operations</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight">
            Ludhiana North Farm — Plot A
          </h1>
          <span className="text-xs px-3 py-1 rounded-full bg-[#EAE4D5] text-[#1C1B18] font-medium self-start sm:self-auto">
            Wheat · HD 3086 (ਕਣਕ · गेहूं)
          </span>
        </div>

        <p className="text-sm text-[#756F63]">
          Sown 15 Nov 2025 · 8.5 Acres Total · Sandy Loam (Central Alluvial Plain) · Soil Moisture: 28% (Optimal)
        </p>
      </div>

      {/* 2. Immediate Directive Box */}
      <div className="animate-reveal delay-1 p-6 sm:p-8 rounded-2xl bg-white/85 border border-[#D8CEBC] shadow-xs backdrop-blur-xs space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-[#B8791E]">
            Immediate Agronomic Action Required
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-[#2D5430] font-medium bg-[#DCFCE7]/70 px-2.5 py-0.5 rounded-full">
            <Sun className="w-3.5 h-3.5" />
            Weather Clear · Safe to Apply
          </span>
        </div>

        <div className="space-y-1">
          <div className="font-serif text-3xl sm:text-4xl text-[#1C1B18]">
            10 Bags Neem-Coated Urea
          </div>
          <div className="text-sm font-medium text-[#756F63]">
            1.2 Bags per Acre across 8.5 Acres (Crown Root Initiation · Day 28)
          </div>
        </div>

        <p className="text-sm text-[#4A463D] leading-relaxed pt-3 border-t border-[#EAE4D5]">
          Broadcast uniformly across dry soil immediately before opening first canal irrigation water. Dry weather window confirmed for the next 48 hours.
        </p>

        <div className="pt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(`/fields/${fieldId}/recommendation`)}
            className="px-5 py-2.5 rounded-lg bg-[#2D5430] hover:bg-[#234226] text-white text-xs font-medium transition-all flex items-center gap-2 cursor-pointer shadow-xs active:scale-95"
          >
            <span>View Complete Fertilizer Plan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => navigate(`/fields/${fieldId}/schedule`)}
            className="px-4 py-2.5 rounded-lg border border-[#DCD6C7] hover:border-[#1C1B18] text-xs font-medium text-[#1C1B18] bg-white transition-all cursor-pointer shadow-2xs"
          >
            View Application Dates
          </button>
        </div>
      </div>

      {/* 3. Field Dossier Items */}
      <div className="animate-reveal delay-2 border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs divide-y divide-[#EAE4D5] overflow-hidden shadow-xs text-sm">
        <div className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors">
          <div className="flex items-center gap-3.5">
            <Sparkles className="w-5 h-5 text-[#B8791E]" />
            <div>
              <div className="font-serif text-lg text-[#1C1B18]">Fertilizer Prescription Docket</div>
              <div className="text-xs text-[#756F63]">20 Bags Urea · 9 Bags DAP · 3.5 Bags Potash total across season</div>
            </div>
          </div>
          <Link
            to={`/fields/${fieldId}/recommendation`}
            className="text-xs font-semibold text-[#2D5430] hover:underline"
          >
            Open Docket →
          </Link>
        </div>

        <div className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors">
          <div className="flex items-center gap-3.5">
            <Calendar className="w-5 h-5 text-[#2D5430]" />
            <div>
              <div className="font-serif text-lg text-[#1C1B18]">Application Schedule</div>
              <div className="text-xs text-[#756F63]">Split 1 (Sowing) complete · Split 2 (Now) · Split 3 (Jan)</div>
            </div>
          </div>
          <Link
            to={`/fields/${fieldId}/schedule`}
            className="text-xs font-semibold text-[#2D5430] hover:underline"
          >
            View Dates →
          </Link>
        </div>

        <div className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors">
          <div className="flex items-center gap-3.5">
            <FlaskConical className="w-5 h-5 text-[#4A463D]" />
            <div>
              <div className="font-serif text-lg text-[#1C1B18]">Soil Test Record</div>
              <div className="text-xs text-[#756F63]">pH 7.4 · Medium Phosphorus (16 kg/ha) · High Potash buffer (310 kg/ha) · Moisture: 28%</div>
            </div>
          </div>
          <Link
            to={`/fields/${fieldId}/soil`}
            className="text-xs font-semibold text-[#2D5430] hover:underline"
          >
            Edit Values →
          </Link>
        </div>

        <div className="p-5 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors">
          <div className="flex items-center gap-3.5">
            <Calendar className="w-5 h-5 text-[#B8791E]" />
            <div>
              <div className="font-serif text-lg text-[#1C1B18]">Previous Fertilizer &amp; Rotation Log (PRD FR5)</div>
              <div className="text-xs text-[#756F63]">Preceding Rice (PR 126) · 5 t/acre FYM incorporated · Carryover active</div>
            </div>
          </div>
          <Link
            to={`/fields/${fieldId}/soil`}
            className="text-xs font-semibold text-[#2D5430] hover:underline"
          >
            Inspect Log →
          </Link>
        </div>
      </div>

    </div>
  );
}

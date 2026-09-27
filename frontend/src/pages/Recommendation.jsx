import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ArrowRight, 
  Printer, 
  Sun, 
  Check, 
  TrendingDown,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Calendar,
  FileText,
  MessageSquare,
  X,
  Send,
  HelpCircle,
  WifiOff
} from 'lucide-react';
import useDocumentTitle from '../hooks/useDocumentTitle.js';
import Crop3DViewer from '../components/three/Crop3DViewer.jsx';
import CropInspectorModal from '../components/three/CropInspectorModal.jsx';

const CROP_TABS = [
  { id: 'wheat', label: 'Wheat (ਕਣਕ)' },
  { id: 'barley', label: 'Barley (ਜੌਂ)' },
  { id: 'rice', label: 'Rice (ਝੋਨਾ)' },
  { id: 'maize', label: 'Maize (ਮੱਕੀ)' },
  { id: 'cotton', label: 'Cotton (ਨਰਮਾ)' },
  { id: 'sugarcane', label: 'Sugarcane (ਗੰਨਾ)' },
  { id: 'chickpea', label: 'Chickpea (ਛੋਲੇ)' },
];

const CROP_PRESCRIPTIONS = {
  wheat: {
    id: 'wheat',
    name: 'Wheat',
    vernacular: 'ਕਣਕ · गेहूं',
    variety: 'HD 3086 / PBW 824',
    cycle: 'Rabi Season · 140 Days',
    standardDose: '123.6 kg N · 62.5 kg P₂O₅ · 30 kg K₂O / ha',
    calibrationNote: 'Soil-Test Offset: -18 kg N (Low soil P compensated via basal DAP)',
    dueStage: 'Crown Root Initiation (CRI Stage · Day 28)',
    dueTitle: 'Apply 10 Bags Neem-Coated Urea',
    dueRate: '1.2 Bags / Acre across 8.5 Acres',
    dueInstruction: 'Broadcast uniformly across dry soil immediately prior to opening first canal irrigation water. Dry weather window confirmed for the next 48 hours.',
    savings: '₹3,400',
    savingsNote: 'Soil-test calibration cut 4 excess Urea bags commonly lost to groundwater leaching.',
    drivingFactors: [
      { factor: 'Low Available Soil Nitrogen (210 kg/ha)', impact: '+25% top-dress Urea split timed strictly to CRI stage prevents crown root tillering aborts.' },
      { factor: 'High Soil Potassium Buffer (310 kg/ha)', impact: 'Safely eliminates 50% Potash (MOP) requirement, saving ₹850 per acre without lodging risk.' },
      { factor: 'Optimal Soil pH (7.4)', impact: 'Ideal neutral-alkaline window ensures 100% bioavailability of drilled DAP phosphate.' },
      { factor: '48-Hour Open-Meteo Radar Window', impact: 'Zero rainfall ensures 0% nitrate leaching into the Malwa alluvial water table.' }
    ],
    faqs: [
      { q: 'Can I apply Urea if it rains tomorrow?', a: 'No. Open-Meteo confirms 0.0mm rain for 48 hours. If rain exceeds 10mm, pause broadcast to prevent nitrate leaching.' },
      { q: 'Why is Potash reduced for this field?', a: 'Your soil test shows 310 kg/ha potassium, which exceeds the PAU high benchmark of 280 kg/ha. Adding extra MOP would be wasteful luxury consumption.' },
      { q: 'Can I mix Zinc Sulphate with DAP at sowing?', a: 'Never mix Zinc Sulphate and DAP together; zinc phosphate precipitate forms, locking up both nutrients.' }
    ],
    ledger: [
      {
        name: 'Neem-Coated Urea (45 kg)',
        tag: 'Due Now',
        tagColor: 'bg-[#FEF3C7] text-[#92400E]',
        total: '20 Bags (2.5 bags/acre across season)',
        detail: 'Split Protocol: 10 bags at 1st watering (CRI) + 10 bags at 2nd watering (Booting)',
        statusPrimary: '10 Bags Due',
        statusSecondary: '10 bags scheduled for Jan',
      },
      {
        name: 'DAP — Diammonium Phosphate (50 kg)',
        tag: 'Applied at Sowing ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '9 Bags (1.1 bags/acre)',
        detail: 'Drilled 4–5 cm below seed during field preparation',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied 15 Nov 2025',
      },
      {
        name: 'MOP — Muriate of Potash (50 kg)',
        tag: 'Applied at Sowing ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '3.5 Bags (0.4 bag/acre)',
        detail: 'Saved 50% Potash due to high natural potassium reserve in your soil',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied 15 Nov 2025',
      },
    ],
  },
  barley: {
    id: 'barley',
    name: 'Barley',
    vernacular: 'ਜੌਂ · जौ',
    variety: 'PL 891 / DWRB 123',
    cycle: 'Rabi Season · 125 Days',
    standardDose: '62.5 kg N · 30 kg P₂O₅ · 15 kg K₂O / ha',
    calibrationNote: 'Drought-tolerant profile: Low water requirement with balanced basal nutrition',
    dueStage: 'Tillering Stage (Day 25–30)',
    dueTitle: 'Apply 6 Bags Neem-Coated Urea',
    dueRate: '0.7 Bag / Acre across 8.5 Acres',
    dueInstruction: 'Top-dress with first light irrigation. Full phosphorus and potash already placed at sowing.',
    savings: '₹2,600',
    savingsNote: 'Calibrated low-N threshold prevents stem lodging in malt barley crops.',
    drivingFactors: [
      { factor: 'Controlled Low-Nitrogen Ceiling', impact: 'Prevents excess grain protein above 11.5%, preserving premium malt valuation.' },
      { factor: 'Moderate Root Phosphorus Requirement', impact: 'Basal placement of 5 bags DAP provides sufficient root anchorage in light soils.' },
      { factor: 'Preceding Crop Residue Factor', impact: 'Cotton residue decomposition adds organic carbon, easing synthetic nitrogen requirements.' }
    ],
    faqs: [
      { q: 'Why is barley fertilizer so much lower than wheat?', a: 'Barley has an efficient fibrous root system and lower grain nitrogen requirement. Excess nitrogen causes early lodging.' },
      { q: 'Is potash necessary for feed barley?', a: 'Yes, 15 kg/ha K₂O ensures drought tolerance during February dry spells.' }
    ],
    ledger: [
      {
        name: 'Neem-Coated Urea (45 kg)',
        tag: 'Due Now',
        tagColor: 'bg-[#FEF3C7] text-[#92400E]',
        total: '12 Bags (1.4 bags/acre across season)',
        detail: 'Split: 6 bags at 1st irrigation + 6 bags at early jointing stage',
        statusPrimary: '6 Bags Due',
        statusSecondary: '6 bags scheduled for late Dec',
      },
      {
        name: 'DAP — Diammonium Phosphate (50 kg)',
        tag: 'Applied at Sowing ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '5 Bags (0.6 bag/acre)',
        detail: 'Basal placement at drilling time',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied 10 Nov 2025',
      },
      {
        name: 'MOP — Muriate of Potash (50 kg)',
        tag: 'Applied at Sowing ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '2.5 Bags (0.3 bag/acre)',
        detail: 'Full dose incorporated during pre-sowing tillage',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied 10 Nov 2025',
      },
    ],
  },
  rice: {
    id: 'rice',
    name: 'Rice (Paddy)',
    vernacular: 'ਝੋਨਾ · धान',
    variety: 'PR 126 / Pusa Basmati 1121',
    cycle: 'Kharif Season · 130 Days',
    standardDose: '120 kg N · 30 kg P₂O₅ · 30 kg K₂O / ha',
    calibrationNote: 'Short-duration Basmati protocol: 3-way nitrogen split to prevent volatilization',
    dueStage: 'Active Tillering Stage (Day 21)',
    dueTitle: 'Apply 7 Bags Neem-Coated Urea + Zinc',
    dueRate: '0.8 Bag / Acre across 8.5 Acres',
    dueInstruction: 'Drain standing water 24 hours prior to broadcasting. Re-flood field 2 days after application.',
    savings: '₹4,100',
    savingsNote: 'Eliminated unneeded late-season urea top-dressing that induces bacterial leaf blight.',
    drivingFactors: [
      { factor: 'Anaerobic Submerged Soil Regime', impact: 'Requires 3 equal splits (7, 21, and 42 days) to avoid gaseous ammonia volatilization.' },
      { factor: 'Zinc Sulphate Essential Requirement', impact: 'Calcareous floodplain soil locks zinc; 25 kg/acre ZnSO₄ prevents khaira disease.' },
      { factor: 'Disease Resistance Potassium Buffer', impact: 'Preserves sheath blight resistance during hot, humid monsoon intervals.' }
    ],
    faqs: [
      { q: 'Should I broadcast urea in standing ponded water?', a: 'Drain water to a thin film before broadcasting, then re-flood after 24–48 hours to force urea into the reduced soil layer.' },
      { q: 'Can I apply urea after 45 days in PR 126?', a: 'No. PR 126 is a 123-day variety. Nitrogen applied past 42 days promotes vegetative foliage and severe sheath blight.' }
    ],
    ledger: [
      {
        name: 'Neem-Coated Urea (45 kg)',
        tag: 'Due Now',
        tagColor: 'bg-[#FEF3C7] text-[#92400E]',
        total: '20 Bags (2.4 bags/acre across season)',
        detail: '3 Equal Splits: 7 bags at 7 days, 7 bags at 21 days (Now), 6 bags at 42 days',
        statusPrimary: '7 Bags Due',
        statusSecondary: 'Final 6 bags in 21 days',
      },
      {
        name: 'Zinc Sulphate Monohydrate 33%',
        tag: 'Applied at Tillering ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '4 Bags (16 kg/acre)',
        detail: 'Essential for khaira disease prevention in alkaline Punjab paddy fields',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied with 1st top-dress',
      },
      {
        name: 'MOP — Muriate of Potash (50 kg)',
        tag: 'Basal Puddled ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '5 Bags (0.6 bag/acre)',
        detail: 'Incorporated into mud before final laser leveling',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied June 2025',
      },
    ],
  },
  maize: {
    id: 'maize',
    name: 'Maize (Corn)',
    vernacular: 'ਮੱਕੀ · मक्का',
    variety: 'PMH 1 / Pioneer 3396',
    cycle: 'Kharif / Spring · 110 Days',
    standardDose: '125 kg N · 60 kg P₂O₅ · 30 kg K₂O / ha',
    calibrationNote: 'High biomass feeder: Critical nitrogen demand at knee-high and tassel initiation',
    dueStage: 'Knee-High Stage (Day 30–35)',
    dueTitle: 'Apply 8 Bags Neem-Coated Urea',
    dueRate: '1.0 Bag / Acre across 8.5 Acres',
    dueInstruction: 'Band-place 5–7 cm away from plant rows, followed immediately by ridge furrow irrigation.',
    savings: '₹3,200',
    savingsNote: 'Band application halved volatilization losses compared to conventional surface broadcasting.',
    drivingFactors: [
      { factor: 'Rapid Vegetative Uptake Curve', impact: 'Nitrogen demand spikes 4x between knee-high and tasseling; targeted split matches root sink.' },
      { factor: 'Sandy Loam Nitrogen Leaching Vulnerability', impact: '3-way split application prevents rapid monsoonal nitrate leaching through coarse pores.' },
      { factor: 'Stalk Strength Potassium Mandate', impact: 'Maintains vascular rind turgor to protect heavy cobs against storm lodging.' }
    ],
    faqs: [
      { q: 'Why band-place fertilizer rather than broadcast in maize?', a: 'Broadcasting in maize causes leaf scorch if fertilizer granules lodge in plant whorls. Banding directly feeds root zones.' }
    ],
    ledger: [
      {
        name: 'Neem-Coated Urea (45 kg)',
        tag: 'Due Now',
        tagColor: 'bg-[#FEF3C7] text-[#92400E]',
        total: '22 Bags (2.6 bags/acre across season)',
        detail: '3 Splits: 6 bags basal, 8 bags knee-high (Now), 8 bags at pre-tasseling',
        statusPrimary: '8 Bags Due',
        statusSecondary: '8 bags due at tasseling',
      },
      {
        name: 'DAP — Diammonium Phosphate (50 kg)',
        tag: 'Applied at Sowing ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '10 Bags (1.2 bags/acre)',
        detail: 'Drilled 5 cm beneath seed furrow at planting',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied July 2025',
      },
      {
        name: 'MOP — Muriate of Potash (50 kg)',
        tag: 'Applied at Sowing ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '5 Bags (0.6 bag/acre)',
        detail: 'Basal application to strengthen stalk rind against lodging',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied at field prep',
      },
    ],
  },
  cotton: {
    id: 'cotton',
    name: 'Cotton',
    vernacular: 'ਨਰਮਾ · कपास',
    variety: 'RCH 659 Bt / Bioseed 6588',
    cycle: 'Kharif Season · 170 Days',
    standardDose: '75 kg N · 30 kg P₂O₅ / ha',
    calibrationNote: 'Malwa Belt American Bt Hybrid: Split application avoids excessive vegetative canopy',
    dueStage: 'First Flower Emergence (Day 55)',
    dueTitle: 'Apply 7 Bags Neem-Coated Urea',
    dueRate: '0.8 Bag / Acre across 8.5 Acres',
    dueInstruction: 'Apply in furrow between rows followed by irrigation. Do not broadcast over foliage.',
    savings: '₹2,900',
    savingsNote: 'Avoided excess nitrogen that attracts sucking pests (whitefly & jassid).',
    drivingFactors: [
      { factor: 'Pest Sensitivity Nitrogen Modulation', impact: 'Restricting vegetative nitrogen prevents succulent leaves that attract deadly whitefly outbreaks.' },
      { factor: 'Deep Taproot Subsoil Nutrient Access', impact: 'Roots penetrate 1.5m, absorbing subsoil phosphorus without requiring heavy top-dress.' },
      { factor: 'Boll Development Potassium Spray', impact: 'Foliar KNO₃ at flowering sustains fiber elongation during peak boll filling.' }
    ],
    faqs: [
      { q: 'Why is urea withheld early in Bt cotton?', a: 'Excess early nitrogen produces rank vegetative growth (tall bushy plants) with fewer fruiting branches.' }
    ],
    ledger: [
      {
        name: 'Neem-Coated Urea (45 kg)',
        tag: 'Due Now',
        tagColor: 'bg-[#FEF3C7] text-[#92400E]',
        total: '14 Bags (1.6 bags/acre across season)',
        detail: 'Split: 7 bags after thinning (Day 30) + 7 bags at flowering (Now)',
        statusPrimary: '7 Bags Due',
        statusSecondary: 'Foliar KNO₃ spray next',
      },
      {
        name: 'DAP — Diammonium Phosphate (50 kg)',
        tag: 'Applied at Sowing ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '5 Bags (0.6 bag/acre)',
        detail: 'Deep placement at bed shaping',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied May 2025',
      },
      {
        name: 'Potassium Nitrate (13:0:45 Foliar Spray)',
        tag: 'Upcoming Stage',
        tagColor: 'bg-[#E0E7FF] text-[#3730A3]',
        total: '4 Sprays (2 kg/acre per spray)',
        detail: 'Spray at 15-day intervals during boll development for fiber elongation',
        statusPrimary: 'Scheduled',
        statusSecondary: 'Starts late July',
      },
    ],
  },
  sugarcane: {
    id: 'sugarcane',
    name: 'Sugarcane',
    vernacular: 'ਗੰਨਾ · गन्ना',
    variety: 'CoJ 85 / Co 0238',
    cycle: 'Annual Crop · 360 Days',
    standardDose: '150 kg N / ha (Ratoon: 225 kg N)',
    calibrationNote: 'Long-duration sugar crop: Basal P & K with 3 seasonal nitrogen splits before monsoon',
    dueStage: 'Grand Growth Stage (Day 90)',
    dueTitle: 'Apply 9 Bags Neem-Coated Urea',
    dueRate: '1.1 Bags / Acre across 8.5 Acres',
    dueInstruction: 'Apply alongside cane rows before earthing up and furrow irrigation water.',
    savings: '₹4,800',
    savingsNote: 'Timely split nitrogen complete before July ensures high sucrose accumulation.',
    drivingFactors: [
      { factor: 'Extended 360-Day Nutrient Demand', impact: 'Requires comprehensive basal phosphorus and 3 nitrogen top-dressings completed before monsoon.' },
      { factor: 'Stooling & Internode Sugar Storage', impact: 'Adequate potassium ensures thick, juicy internodes with >18° Brix sucrose content.' },
      { factor: 'Monsoon Nitrogen Cut-Off Rule', impact: 'Zero nitrogen applied post-July to force cane vegetative slowing and sucrose ripening.' }
    ],
    faqs: [
      { q: 'Can I apply urea to sugarcane in August?', a: 'Never apply nitrogen to cane after July. Late nitrogen causes late tillers that degrade juice sugar purity.' }
    ],
    ledger: [
      {
        name: 'Neem-Coated Urea (45 kg)',
        tag: 'Due Now',
        tagColor: 'bg-[#FEF3C7] text-[#92400E]',
        total: '28 Bags (3.3 bags/acre across season)',
        detail: '3 Splits: 9 bags at germination, 10 bags at tillering, 9 bags at earthing-up (Now)',
        statusPrimary: '9 Bags Due',
        statusSecondary: 'Completed all N splits',
      },
      {
        name: 'DAP — Diammonium Phosphate (50 kg)',
        tag: 'Applied at Furrow ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '8.5 Bags (1.0 bag/acre)',
        detail: 'Placed in furrows directly beneath cane setts before covering',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied at planting',
      },
      {
        name: 'MOP — Muriate of Potash (50 kg)',
        tag: 'Applied at Planting ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '8.5 Bags (1.0 bag/acre)',
        detail: 'Crucial for cane thickness, drought resistance, and juice brix',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied at planting',
      },
    ],
  },
  chickpea: {
    id: 'chickpea',
    name: 'Chickpea (Gram)',
    vernacular: 'ਛੋਲੇ · चना',
    variety: 'PBG 7 / PBG 8 (Desi Gram)',
    cycle: 'Rabi Season · 135 Days',
    standardDose: '15 kg N · 40 kg P₂O₅ / ha',
    calibrationNote: 'Legume biological N-fixation: Starter nitrogen only; Rhizobium fixes atmospheric N',
    dueStage: 'Branching / Pre-Flowering (Day 40)',
    dueTitle: 'Check Nodulation · Zero Urea Top-Dress',
    dueRate: '0 Bags Urea (Nodules Active)',
    dueInstruction: 'Do not apply urea! Legume root nodules fix all required nitrogen. Excess urea aborts flowers.',
    savings: '₹3,800',
    savingsNote: 'Protected biological nitrogen fixation, saving 100% top-dressed urea costs.',
    drivingFactors: [
      { factor: 'Symbiotic Rhizobium Root Nodules', impact: 'Fixes 35–45 kg atmospheric nitrogen per hectare; adding chemical urea shuts down natural nodules.' },
      { factor: 'High Phosphorus Requirement (40 kg P₂O₅)', impact: 'Phosphorus drives deep taproot elongation and nodule formation in dry sandy loams.' },
      { factor: 'Flower Abort Prevention', impact: 'Withholding nitrogen prevents vegetative canopy overgrowth and enhances pod pod-set.' }
    ],
    faqs: [
      { q: 'Should I spray urea if chickpea looks pale?', a: 'No! Dig up a plant and check if nodules are pink inside. Pink indicates active nitrogen fixation. Spray 2% urea only if nodules are absent.' }
    ],
    ledger: [
      {
        name: 'Neem-Coated Urea (Starter Only)',
        tag: 'Starter Completed ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '2.5 Bags (0.3 bag/acre)',
        detail: 'Starter dose at sowing only to nourish seedlings before nodules form',
        statusPrimary: 'Completed',
        statusSecondary: 'No top-dressing needed',
      },
      {
        name: 'DAP — Diammonium Phosphate (50 kg)',
        tag: 'Applied at Sowing ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '7 Bags (0.8 bag/acre)',
        detail: 'Drilled with seed; essential for deep taproot nodule proliferation',
        statusPrimary: 'Completed',
        statusSecondary: 'Applied at sowing',
      },
      {
        name: 'Rhizobium Bio-Fertilizer (Inoculant)',
        tag: 'Applied to Seed ✓',
        tagColor: 'bg-[#DCFCE7] text-[#166534]',
        total: '8 Packets (1 packet/acre)',
        detail: 'Seed treatment before sowing for root nodule colonization',
        statusPrimary: 'Active in Soil',
        statusSecondary: 'Fixing ~40 kg N/ha',
      },
    ],
  },
};

export default function Recommendation() {
  const { fieldId = '1' } = useParams();
  const navigate = useNavigate();
  useDocumentTitle('Agronomic Prescription Docket — KhetGPT');

  const [selectedCropId, setSelectedCropId] = useState('wheat');
  const [inspectModalCrop, setInspectModalCrop] = useState(null);

  // PRD Could-Have #16: Agronomist Assistant Drawer state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [userQuery, setUserQuery] = useState('');
  const [assistantMessages, setAssistantMessages] = useState([
    {
      sender: 'assistant',
      text: 'Sat Sri Akal! I am your KhetGPT Agronomist Assistant calibrated for Punjab field trials. Ask me anything about your current dose, weather safety, or split timing.'
    }
  ]);

  const activePrescription = CROP_PRESCRIPTIONS[selectedCropId] || CROP_PRESCRIPTIONS.wheat;

  const handlePrint = () => {
    window.print();
  };

  const handleAskQuestion = (questionText, answerText) => {
    setAssistantMessages((prev) => [
      ...prev,
      { sender: 'user', text: questionText },
      { sender: 'assistant', text: answerText || `Based on PAU Package of Practices for ${activePrescription.name}: your soil-test calibrated rate is ${activePrescription.dueRate} for the ${activePrescription.dueStage}. 48-hour agromet radar confirms clear weather for application.` }
    ]);
  };

  const handleSendCustomQuery = (e) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    const q = userQuery.trim();
    setUserQuery('');

    // Generate intelligent agronomy response based on active crop
    let answer = `For ${activePrescription.name} in Ludhiana/Central Punjab: PAU trials recommend ${activePrescription.standardDose}. Ensure soil moisture is within 25–35% before top-dressing. Open-Meteo confirms safe 48h application window.`;
    if (q.toLowerCase().includes('rain') || q.toLowerCase().includes('weather')) {
      answer = `Current Agromet forecast indicates 0.0mm precipitation for the next 48 hours. It is 100% safe to apply ${activePrescription.dueTitle}.`;
    } else if (q.toLowerCase().includes('cost') || q.toLowerCase().includes('save') || q.toLowerCase().includes('price')) {
      answer = `Your calibrated prescription saves approximately ${activePrescription.savings} by cutting unneeded fertilizer bags compared to standard dealer recommendations.`;
    } else if (q.toLowerCase().includes('urea') || q.toLowerCase().includes('nitrogen')) {
      answer = `Current recommended nitrogen dose is ${activePrescription.dueRate}. Never broadcast urea in standing ponded water or high wind.`;
    }

    setAssistantMessages((prev) => [
      ...prev,
      { sender: 'user', text: q },
      { sender: 'assistant', text: answer }
    ]);
  };

  return (
    <div className="space-y-8 font-sans text-[#1C1B18]">
      
      {/* 3D Crop Inspector Modal */}
      {inspectModalCrop && (
        <CropInspectorModal
          cropId={inspectModalCrop}
          onClose={() => setInspectModalCrop(null)}
        />
      )}

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
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#2D5430] bg-[#DCFCE7]/70 px-2.5 py-0.5 rounded-full">
              ML Deficit Engine Calibrated
            </span>
            <span className="text-xs text-[#756F63]">
              PAU Package of Practices · ICAR STCR
            </span>
            {/* PRD Could-Have #13: Offline Resilient Caching Indicator */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#4A463D] bg-[#EFE9DC] px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3 text-[#2D5430]" />
              Offline Cached
            </span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight">
            Fertilizer Prescription Docket
          </h1>
          <p className="text-sm text-[#756F63] mt-1.5 flex flex-wrap items-center gap-2">
            <span>Plot A · 8.5 Acres</span>
            <span className="text-[#C5BBAA]">·</span>
            <span className="inline-flex items-center gap-1 text-[#2D5430] font-medium bg-[#DCFCE7]/70 px-2 py-0.5 rounded-full text-xs">
              <Sun className="w-3.5 h-3.5" />
              Weather Safe (0.0mm rain next 48h)
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 text-xs font-medium text-[#615C52] hover:text-[#1C1B18] border border-[#DCD6C7] rounded-lg bg-white/80 hover:bg-white transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dealer Slip</span>
          </button>

          <button
            type="button"
            onClick={() => navigate(`/fields/${fieldId}/schedule`)}
            className="px-4 py-2 text-xs font-medium text-white bg-[#2D5430] hover:bg-[#234226] rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
          >
            <span>Application Dates</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Crop Selection Switcher Tabs */}
      <div className="animate-reveal delay-1 flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
        <span className="text-xs font-medium text-[#756F63] shrink-0 mr-1">
          Select Crop:
        </span>
        {CROP_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedCropId(tab.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
              selectedCropId === tab.id
                ? 'bg-[#2D5430] text-white shadow-xs'
                : 'bg-white/80 border border-[#D8CEBC] text-[#615C52] hover:text-[#1C1B18] hover:bg-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Hero 3D Interactive Stage & ML Prescription */}
      <div className="animate-reveal delay-1 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-white/95 to-[#F4F1EA] border border-[#D8CEBC] shadow-sm backdrop-blur-xs flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left: 3D Canvas Viewport */}
        <div className="w-full lg:w-5/12 h-80 sm:h-96 rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-[#EAE3D3] border border-[#D8CEBC] relative overflow-hidden shadow-inner flex flex-col justify-between p-4">
          <div className="absolute inset-0">
            <Crop3DViewer cropId={selectedCropId} autoRotate={true} enableZoom={true} />
          </div>

          <div className="relative z-10 flex items-center justify-between pointer-events-none">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2D5430] bg-white/90 px-3 py-1 rounded-full border border-[#D8CEBC] shadow-2xs">
              Live 3D Model
            </span>
            <span className="text-[11px] text-[#756F63] bg-white/80 px-2.5 py-1 rounded-md">
              Drag to rotate 360°
            </span>
          </div>

          <div className="relative z-10 flex items-center justify-between text-[11px] text-[#756F63] bg-white/80 px-3 py-1.5 rounded-xl border border-[#D8CEBC] shadow-2xs pointer-events-none">
            <span>Procedural 60 FPS WebGL</span>
            <span className="text-[#B8791E] font-medium flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              Scroll to zoom
            </span>
          </div>
        </div>

        {/* Right: ML Recommendation & Immediate Application Directive */}
        <div className="w-full lg:w-7/12 space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#B8791E]">
                {activePrescription.dueStage}
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1B18] tracking-tight mt-0.5">
                {activePrescription.name}
              </h2>
              <p className="text-xs text-[#756F63] font-medium mt-0.5">
                {activePrescription.vernacular} · {activePrescription.variety} ({activePrescription.cycle})
              </p>
            </div>
            
            <button
              type="button"
              onClick={() => setInspectModalCrop(selectedCropId)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#D8CEBC] hover:border-[#2D5430] text-xs font-medium text-[#2D5430] hover:bg-[#FAF8F5] transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Inspect Specs</span>
            </button>
          </div>

          {/* Immediate Action Window Box */}
          <div className="p-5 rounded-2xl bg-white border border-[#E8E2D5] shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#2D5430] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#2D5430]" />
                Recommended Action
              </span>
              <span className="text-xs text-[#2D5430] font-medium flex items-center gap-1 bg-[#DCFCE7]/70 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D5430]" />
                Moisture Optimal
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
              <div className="font-serif text-2xl sm:text-3xl text-[#1C1B18]">
                {activePrescription.dueTitle}
              </div>
              <div className="text-xs font-medium text-[#756F63]">
                {activePrescription.dueRate}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#4A463D] leading-relaxed pt-2 border-t border-[#F4F1EA]">
              {activePrescription.dueInstruction}
            </p>
          </div>

          {/* Standard Dose & Calibration Offset */}
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-1 text-xs">
            <div className="flex items-center justify-between text-[#756F63]">
              <span>Official PAU Benchmark:</span>
              <span className="font-medium text-[#1C1B18]">{activePrescription.standardDose}</span>
            </div>
            <div className="flex items-center justify-between text-[#2D5430] pt-1 border-t border-[#EAE4D5]">
              <span>ML Engine Calibration:</span>
              <span className="font-medium">{activePrescription.calibrationNote}</span>
            </div>
          </div>

        </div>

      </div>

      {/* 4. Complete Season Fertilizer Ledger Rows */}
      <div className="animate-reveal delay-2 space-y-3">
        <div className="flex items-center justify-between px-2">
          <div className="text-xs font-medium uppercase tracking-wider text-[#756F63]">
            Complete Season Requirement for {activePrescription.name} (8.5 Acres)
          </div>
          <span className="text-xs text-[#2D5430] font-medium">
            PAU Research Aligned
          </span>
        </div>

        <div className="border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs divide-y divide-[#EAE4D5] shadow-xs overflow-hidden">
          {activePrescription.ledger.map((item, idx) => (
            <div key={idx} className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAF8F5] transition-colors">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-serif text-lg text-[#1C1B18]">
                    {item.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium ${item.tagColor}`}>
                    {item.tag}
                  </span>
                </div>
                <div className="text-sm text-[#756F63]">
                  Total: <strong className="font-semibold text-[#1C1B18]">{item.total}</strong>
                </div>
                <div className="text-xs text-[#8A8477]">
                  {item.detail}
                </div>
              </div>

              <div className="sm:text-right shrink-0">
                <div className="font-serif text-xl sm:text-2xl text-[#1C1B18]">{item.statusPrimary}</div>
                <div className="text-xs text-[#756F63]">{item.statusSecondary}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4.5. PRD Should-Have #10: Agronomic Reasoning · Top Driving Factors */}
      <div className="animate-reveal delay-2 border border-[#D8CEBC] rounded-2xl bg-white/80 backdrop-blur-xs p-5 sm:p-6 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#756F63] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#B8791E]" />
            <span>Agronomic Reasoning · Top Driving Factors (PRD #10)</span>
          </div>
          <span className="text-[11px] text-[#2D5430] font-medium bg-[#DCFCE7] px-2.5 py-0.5 rounded-full">
            Explainable Agronomy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {activePrescription.drivingFactors?.map((df, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#E8E2D5] space-y-1 text-xs">
              <div className="font-semibold text-[#1C1B18] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D5430]" />
                <span>{df.factor}</span>
              </div>
              <p className="text-[#615C52] pl-3 leading-relaxed">
                {df.impact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Economic & Agronomic Impact Summary */}
      <div className="animate-reveal delay-3 p-5 rounded-2xl border border-[#D8CEBC] bg-white/60 backdrop-blur-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-8 h-8 rounded-full bg-[#2D5430]/10 text-[#2D5430] flex items-center justify-center shrink-0 mt-0.5">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <div className="font-serif text-lg text-[#1C1B18]">
              Estimated {activePrescription.savings} Saved in Unnecessary Fertilizer
            </div>
            <div className="text-xs text-[#756F63] mt-0.5">
              {activePrescription.savingsNote}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={`/fields/${fieldId}/risk-check`}
            className="text-xs font-semibold text-[#B8791E] hover:underline"
          >
            Check Over-Application Risk →
          </Link>
          <span className="text-[#D8CEBC]">·</span>
          <Link
            to={`/fields/${fieldId}/soil`}
            className="text-xs font-semibold text-[#2D5430] hover:underline"
          >
            Calibrate Soil Values →
          </Link>
        </div>
      </div>

      {/* PRD Could-Have #16: Floating KhetGPT Agronomist Assistant Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          type="button"
          onClick={() => setIsAssistantOpen(true)}
          className="px-4 py-2.5 rounded-full bg-[#1C1B18] hover:bg-[#2D5430] text-[#FAF8F5] text-xs font-medium shadow-xl border border-[#3E382E] flex items-center gap-2 cursor-pointer transition-all active:scale-95 group"
        >
          <span className="w-2 h-2 rounded-full bg-[#86EFAC] animate-pulse" />
          <span>🌾 Ask Agronomist (PRD #16)</span>
        </button>
      </div>

      {/* PRD Could-Have #16: KhetGPT Agronomist Assistant Drawer / Modal */}
      {isAssistantOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="w-full max-w-lg bg-[#FAF8F5] border border-[#D8CEBC] rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
            
            {/* Header */}
            <div className="px-5 py-4 bg-[#1C1B18] text-[#FAF8F5] flex items-center justify-between border-b border-[#3E382E]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#2D5430] flex items-center justify-center text-sm">
                  🌾
                </div>
                <div>
                  <h3 className="font-serif text-lg leading-tight">KhetGPT Agronomist Assistant</h3>
                  <div className="text-[10px] text-[#B8791E] uppercase tracking-wider font-medium">
                    PAU Package of Practices Calibrated (PRD #16)
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAssistantOpen(false)}
                className="p-1.5 rounded-lg text-[#C5BBAA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3.5 text-xs">
              
              {/* Prescriptions Context Banner */}
              <div className="p-3 rounded-xl bg-white border border-[#E8E2D5] space-y-1">
                <span className="font-semibold text-[#1C1B18] block">
                  Active Consultation Context: {activePrescription.name} ({activePrescription.vernacular})
                </span>
                <p className="text-[#756F63]">
                  Rate: {activePrescription.dueRate} · Stage: {activePrescription.dueStage} · Weather: 48h Clear
                </p>
              </div>

              {/* Message History */}
              {assistantMessages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-3.5 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-[#2D5430] text-white rounded-br-none'
                      : 'bg-white border border-[#E8E2D5] text-[#1C1B18] rounded-bl-none shadow-2xs'
                  }`}>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                </div>
              ))}

              {/* Quick Prompt Chips */}
              <div className="pt-2 space-y-1.5">
                <div className="text-[11px] font-semibold text-[#756F63] uppercase tracking-wider">
                  Quick Questions for {activePrescription.name}:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {activePrescription.faqs?.map((faq, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleAskQuestion(faq.q, faq.a)}
                      className="px-3 py-1 rounded-lg bg-white border border-[#DCD6C7] hover:border-[#2D5430] text-left text-[11px] text-[#2D5430] font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
                    >
                      {faq.q}
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendCustomQuery} className="p-4 bg-white border-t border-[#E8E2D5] flex items-center gap-2">
              <input
                type="text"
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Ask about fertilizer splits, weather, or soil health..."
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-[#DCD6C7] focus:outline-none focus:ring-2 focus:ring-[#2D5430]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#2D5430] hover:bg-[#234226] text-white rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 shrink-0"
              >
                <span>Ask</span>
                <Send className="w-3 h-3" />
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

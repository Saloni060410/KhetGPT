/**
 * Fertilizer Prescription Docket Data
 * Calibrated with Punjab Agricultural University (PAU) Package of Practices
 * and ICAR-IISS Soil Test Crop Response (STCR) models for 8.5 Acres.
 */

export const DOCKET_DATA = {
  plotMeta: {
    plotName: 'Plot A',
    acreage: 8.5,
    location: 'Ludhiana Central Agro-Climatic Zone, Punjab',
    soilTexture: 'Sandy Loam (Typic Ustochrept)',
    weatherStatus: 'Weather Safe (0.0mm rain next 48h)',
    irrigationSource: 'Sirhind Canal Feeder + Tubewell (Solar)',
    lastSoilTestDate: '12 Oct 2025 (PAU Soil Testing Lab)',
    docketId: 'PAU-STCR-2026-884A',
  },
  crops: [
    {
      id: 'wheat',
      name: 'Wheat',
      punjabiName: 'ਕਣਕ',
      hindiName: 'गेहूं',
      displayLabel: 'Wheat (ਕਣਕ)',
      variety: 'HD 3086 / PBW 824',
      season: 'Rabi Season · 140 Days',
      currentStage: 'CROWN ROOT INITIATION (CRI STAGE · DAY 28)',
      stageBadge: 'CRI STAGE',
      modelFile: '/wheat.glb?v=1',
      modelType: 'glb',
      targetHeight: 1.0,
      color: '#D49222',
      recommendedAction: {
        title: 'Apply 10 Bags Neem-Coated Urea',
        subtext: '1.2 Bags / Acre across 8.5 Acres',
        badge: 'Moisture Optimal',
        description:
          'Broadcast uniformly across dry soil immediately prior to opening first canal irrigation water. Dry weather window confirmed for the next 48 hours.',
        pauBenchmark: '123.6 kg N · 62.5 kg P₂O₅ · 30 kg K₂O / ha',
      },
      seasonRequirements: [
        {
          name: 'Neem-Coated Urea (45 kg)',
          status: 'Due Now',
          statusType: 'due',
          totalBags: '20 Bags (2.5 bags/acre across season)',
          splitProtocol:
            'Split Protocol: 10 bags at 1st watering (CRI) + 10 bags at 2nd watering (Booting)',
          dueAmount: '10 Bags Due',
          dueSchedule: '10 bags scheduled for Jan',
          completed: false,
        },
        {
          name: 'DAP — Diammonium Phosphate (50 kg)',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '9 Bags (1.1 bags/acre)',
          splitProtocol: 'Drilled 4–5 cm below seed during field preparation',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 15 Nov 2025',
          completed: true,
        },
        {
          name: 'MOP — Muriate of Potash (50 kg)',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '3.5 Bags (0.4 bag/acre)',
          splitProtocol:
            'Saved 50% Potash due to high natural potassium reserve in your soil',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 15 Nov 2025',
          completed: true,
        },
      ],
      agronomicReasoning: [
        {
          title: 'Low Available Soil Nitrogen (210 kg/ha)',
          description:
            '+25% top-dress Urea split timed strictly to CRI stage prevents crown root tillering aborts.',
        },
        {
          title: 'High Soil Potassium Buffer (310 kg/ha)',
          description:
            'Safely eliminates 50% Potash (MOP) requirement, saving ₹850 per acre without lodging risk.',
        },
        {
          title: 'Optimal Soil pH (7.4)',
          description:
            'Ideal neutral-alkaline window ensures 100% bioavailability of drilled DAP phosphate.',
        },
        {
          title: '48-Hour Open-Meteo Radar Window',
          description:
            'Zero rainfall ensures 0% nitrate leaching into the Malwa alluvial water table.',
        },
      ],
      estimatedSavings: {
        amount: '₹3,400',
        description:
          'Soil-test calibration cut 4 excess Urea bags commonly lost to groundwater leaching.',
      },
    },
    {
      id: 'barley',
      name: 'Barley',
      punjabiName: 'ਜੌਂ',
      hindiName: 'जौ',
      displayLabel: 'Barley (ਜੌਂ)',
      variety: 'PL 426 / DWRB 137',
      season: 'Rabi Season · 125 Days',
      currentStage: 'ACTIVE TILLERING (STAGE · DAY 32)',
      stageBadge: 'TILLERING STAGE',
      modelFile: '/barley.glb?v=1',
      modelType: 'glb',
      targetHeight: 1.05,
      color: '#E0A838',
      recommendedAction: {
        title: 'Apply 6 Bags Neem-Coated Urea',
        subtext: '0.7 Bags / Acre across 8.5 Acres',
        badge: 'Moisture Adequate',
        description:
          'Top-dress before light secondary irrigation. Moderate nitrogen preserves low protein percentage required for malting barley specifications.',
        pauBenchmark: '62.5 kg N · 30.0 kg P₂O₅ · 15 kg K₂O / ha',
      },
      seasonRequirements: [
        {
          name: 'Neem-Coated Urea (45 kg)',
          status: 'Due Now',
          statusType: 'due',
          totalBags: '12 Bags (1.4 bags/acre across season)',
          splitProtocol:
            'Split Protocol: 6 bags at sowing basal + 6 bags at first irrigation',
          dueAmount: '6 Bags Due',
          dueSchedule: '6 bags due this week',
          completed: false,
        },
        {
          name: 'DAP — Diammonium Phosphate (50 kg)',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '6 Bags (0.7 bags/acre)',
          splitProtocol: 'Drilled with seed drill at sowing',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 18 Nov 2025',
          completed: true,
        },
        {
          name: 'Zinc Sulfate (21% Zn)',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '85 kg (10 kg/acre)',
          splitProtocol: 'Soil incorporated during primary tillage',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 18 Nov 2025',
          completed: true,
        },
      ],
      agronomicReasoning: [
        {
          title: 'High Malting Quality Specification',
          description:
            'Excess N increases grain protein beyond 11.5%, which causes brew hazing and forfeits premium pricing.',
        },
        {
          title: 'Drought & Salinity Tolerance Buffer',
          description:
            'Osmotic root pressure requires 30% less irrigation volume compared to semi-dwarf wheat.',
        },
        {
          title: 'Subsurface Zinc Fixation Prevention',
          description:
            'Basal zinc sulfate application prevents interveinal chlorosis across high pH alluvial patches.',
        },
        {
          title: 'Clear 72h Micro-Climate Window',
          description:
            'No morning fog forecasted; optimal stomatal transpiration window for uptake.',
        },
      ],
      estimatedSavings: {
        amount: '₹2,850',
        description:
          'Controlled nitrogen dosage prevented grain lodging and reduced post-harvest drying costs.',
      },
    },
    {
      id: 'rice',
      name: 'Rice / Paddy',
      punjabiName: 'ਝੋਨਾ',
      hindiName: 'धान',
      displayLabel: 'Rice (ਝੋਨਾ)',
      variety: 'PR 126 / Pusa Basmati 1509',
      season: 'Kharif Season · 120 Days',
      currentStage: 'ACTIVE TILLERING (STAGE · DAY 21)',
      stageBadge: 'TILLERING',
      modelFile: '/rice.glb?v=1',
      modelType: 'glb',
      targetHeight: 0.92,
      color: '#10B981',
      recommendedAction: {
        title: 'Apply 12 Bags Neem-Coated Urea + Zinc',
        subtext: '1.4 Bags / Acre across 8.5 Acres',
        badge: 'Water Depth: 2cm',
        description:
          'Drain excess standing water to shallow 2–3 cm depth. Broadcast urea evenly in late afternoon after dew evaporates to eliminate leaf burn.',
        pauBenchmark: '120.0 kg N · 30.0 kg P₂O₅ · 30 kg K₂O / ha',
      },
      seasonRequirements: [
        {
          name: 'Neem-Coated Urea (45 kg)',
          status: 'Due Now',
          statusType: 'due',
          totalBags: '24 Bags (2.8 bags/acre across season)',
          splitProtocol:
            'Split Protocol: 12 bags at tillering + 12 bags at panicle initiation',
          dueAmount: '12 Bags Due',
          dueSchedule: '12 bags due now',
          completed: false,
        },
        {
          name: 'DAP — Diammonium Phosphate (50 kg)',
          status: 'Applied at Puddling ✓',
          statusType: 'completed',
          totalBags: '5 Bags (0.6 bags/acre)',
          splitProtocol: 'Incorporated into puddled soil before final levelling',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 22 June 2025',
          completed: true,
        },
        {
          name: 'Zinc Sulfate Monohydrate (33%)',
          status: 'Applied at Puddling ✓',
          statusType: 'completed',
          totalBags: '42 kg (5 kg/acre)',
          splitProtocol: 'Basal placement to immunize against Khaira disease',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 22 June 2025',
          completed: true,
        },
      ],
      agronomicReasoning: [
        {
          title: 'Anaerobic Root Denitrification Guard',
          description:
            'Split top-dressing reduces gaseous ammonia volatilization by 38% under saturated conditions.',
        },
        {
          title: 'Zinc-Phosphorus Antagonism Mitigated',
          description:
            'Separating DAP drilling from zinc application prevented chemical insolubility in the root rhizosphere.',
        },
        {
          title: 'Direct-Seeded Rice (DSR) Water Saving',
          description:
            'Alternate wetting and drying (AWD) cycle saves 18–20 lakh liters of groundwater per acre.',
        },
        {
          title: 'Solar Influx Optimal',
          description:
            'Strong photosynthetic assimilation accelerates panicle primordia differentiation.',
        },
      ],
      estimatedSavings: {
        amount: '₹4,100',
        description:
          'Leaf Color Chart (LCC) calibrated timing eliminated 5 excess urea bags without yield drop.',
      },
    },
    {
      id: 'maize',
      name: 'Maize',
      punjabiName: 'ਮੱਕੀ',
      hindiName: 'मक्का',
      displayLabel: 'Maize (ਮੱਕੀ)',
      variety: 'PMH 1 / PMH 13 (Kharif/Spring)',
      season: 'Kharif/Spring · 100 Days',
      currentStage: 'KNEE-HIGH VEGETATIVE (STAGE · DAY 30)',
      stageBadge: 'KNEE-HIGH STAGE',
      modelFile: '/corn.glb?v=1',
      modelType: 'glb',
      targetHeight: 1.4,
      color: '#ECA817',
      recommendedAction: {
        title: 'Apply 11 Bags Neem-Coated Urea Banding',
        subtext: '1.3 Bags / Acre across 8.5 Acres',
        badge: 'Moisture Optimal',
        description:
          'Band placement 7–10 cm along crop rows followed by light earthing-up to prevent lodging and maximize nodal root nutrient interception.',
        pauBenchmark: '125.0 kg N · 60.0 kg P₂O₅ · 30 kg K₂O / ha',
      },
      seasonRequirements: [
        {
          name: 'Neem-Coated Urea (45 kg)',
          status: 'Due Now',
          statusType: 'due',
          totalBags: '22 Bags (2.6 bags/acre across season)',
          splitProtocol:
            'Split Protocol: 11 bags at knee-high + 11 bags at pre-tasseling',
          dueAmount: '11 Bags Due',
          dueSchedule: '11 bags due this week',
          completed: false,
        },
        {
          name: 'DAP — Diammonium Phosphate (50 kg)',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '10 Bags (1.2 bags/acre)',
          splitProtocol: 'Drilled with automatic pneumatic planter',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 10 July 2025',
          completed: true,
        },
        {
          name: 'MOP — Muriate of Potash (50 kg)',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '4 Bags (0.5 bags/acre)',
          splitProtocol: 'Basal placement to strengthen heavy stalk rind',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 10 July 2025',
          completed: true,
        },
      ],
      agronomicReasoning: [
        {
          title: 'Heavy C4 Nitrogen Demand Period',
          description:
            'Knee-high to tasseling requires 60% of total nitrogen; timely banding doubles cob ear length.',
        },
        {
          title: 'Potassium-Assisted Stalk Sturdiness',
          description:
            'Basal potash strengthens rind cell walls, eliminating monsoon stalk breakage.',
        },
        {
          title: 'Fall Armyworm (FAW) Scouted Zero Threshold',
          description:
            'Vigorous vegetative growth ensures rapid canopy closure and natural pest defense.',
        },
        {
          title: 'Earthing-Up Integration',
          description:
            'Simultaneous weed clearing and ridge formation anchors brace roots firmly in soil.',
        },
      ],
      estimatedSavings: {
        amount: '₹3,200',
        description:
          'Banded application prevented 35% nitrogen loss compared to traditional broadcast methods.',
      },
    },
    {
      id: 'cotton',
      name: 'Cotton',
      punjabiName: 'ਨਰਮਾ',
      hindiName: 'कपास',
      displayLabel: 'Cotton (ਨਰਮਾ)',
      variety: 'RCH 659 / Bt Cotton Bollgard II',
      season: 'Kharif Season · 165 Days',
      currentStage: 'EARLY SQUARE TO FLOWERING (STAGE · DAY 55)',
      stageBadge: 'SQUARE FORMATION',
      modelFile: '/cotton.glb?v=1',
      modelType: 'glb',
      targetHeight: 0.95,
      color: '#06B6D4',
      recommendedAction: {
        title: 'Apply 8 Bags Urea + Potassium Nitrate Spray',
        subtext: '0.9 Bags / Acre across 8.5 Acres',
        badge: 'Canopy Clear',
        description:
          'Top-dress urea at first flower emergence. Foliar spray 2% Potassium Nitrate (13:0:45) to prevent boll drop and parawilt symptoms.',
        pauBenchmark: '90.0 kg N · 30.0 kg P₂O₅ · 30 kg K₂O / ha',
      },
      seasonRequirements: [
        {
          name: 'Neem-Coated Urea (45 kg)',
          status: 'Due Now',
          statusType: 'due',
          totalBags: '16 Bags (1.9 bags/acre across season)',
          splitProtocol:
            'Split Protocol: 8 bags at square formation + 8 bags at peak flowering',
          dueAmount: '8 Bags Due',
          dueSchedule: '8 bags due now',
          completed: false,
        },
        {
          name: 'DAP — Diammonium Phosphate (50 kg)',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '5 Bags (0.6 bags/acre)',
          splitProtocol: 'Drilled 5 cm away from seed furrow line',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 05 May 2025',
          completed: true,
        },
        {
          name: 'Potassium Nitrate (13:0:45) Foliar',
          status: 'Scheduled Foliar',
          statusType: 'due',
          totalBags: '4 sprays @ 2 kg/acre',
          splitProtocol: 'Weekly intervals starting at peak flowering stage',
          dueAmount: 'Spray 1 Due',
          dueSchedule: 'Scheduled for next week',
          completed: false,
        },
      ],
      agronomicReasoning: [
        {
          title: 'Boll Drop & Abscission Prevention',
          description:
            'Foliar K⁺ translocation directly sustains developing fiber cellulose synthesis in bolls.',
        },
        {
          title: 'Bt Cotton Synchronized Vigor',
          description:
            'Avoid excessive vegetative rank growth that attracts whitefly and pink bollworm pests.',
        },
        {
          title: 'Deep Taproot Hydraulic Architecture',
          description:
            'Taproots access subsoil moisture up to 1.8 meters, reducing surface irrigation dependency.',
        },
        {
          title: 'Micronutrient Balance (Magnesium + Boron)',
          description:
            'Ensures complete boll opening without internal carpel rot.',
        },
      ],
      estimatedSavings: {
        amount: '₹4,800',
        description:
          'Targeted foliar nutrition replaced 3 unnecessary soil fertilizer bags with 25% higher fiber yield.',
      },
    },
    {
      id: 'sugarcane',
      name: 'Sugarcane',
      punjabiName: 'ਗੰਨਾ',
      hindiName: 'गन्ना',
      displayLabel: 'Sugarcane (ਗੰਨਾ)',
      variety: 'CoPb 95 / Co 0238 (Autumn/Spring)',
      season: 'Perennial/Annual · 365 Days',
      currentStage: 'BOOM CANE ELONGATION (STAGE · DAY 90)',
      stageBadge: 'ELONGATION STAGE',
      modelFile: '/sugarcane.glb?v=1',
      modelType: 'glb',
      targetHeight: 1.65,
      color: '#427433',
      recommendedAction: {
        title: 'Apply 15 Bags Neem-Coated Urea Side-Dressed',
        subtext: '1.8 Bags / Acre across 8.5 Acres',
        badge: 'Furrow Moist',
        description:
          'Apply along furrows followed immediately by earthing-up. Complete chemical nitrogen dosage before monsoon sets in to maximize sucrose brix accumulation.',
        pauBenchmark: '150.0 kg N · 60.0 kg P₂O₅ · 60 kg K₂O / ha',
      },
      seasonRequirements: [
        {
          name: 'Neem-Coated Urea (45 kg)',
          status: 'Due Now',
          statusType: 'due',
          totalBags: '30 Bags (3.5 bags/acre across season)',
          splitProtocol:
            'Split Protocol: 15 bags at tillering + 15 bags at pre-monsoon earthing-up',
          dueAmount: '15 Bags Due',
          dueSchedule: '15 bags due this week',
          completed: false,
        },
        {
          name: 'DAP — Diammonium Phosphate (50 kg)',
          status: 'Applied in Furrow ✓',
          statusType: 'completed',
          totalBags: '11 Bags (1.3 bags/acre)',
          splitProtocol: 'Placed under cane setts during trench planting',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 15 March 2025',
          completed: true,
        },
        {
          name: 'MOP — Muriate of Potash (50 kg)',
          status: 'Applied in Furrow ✓',
          statusType: 'completed',
          totalBags: '8 Bags (0.9 bags/acre)',
          splitProtocol: 'Basal placement to increase sucrose sugar content',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 15 March 2025',
          completed: true,
        },
      ],
      agronomicReasoning: [
        {
          title: 'High Biomass Cane Internode Lengthening',
          description:
            'Pre-monsoon nitrogen drives heavy millable cane weight without delaying sugar ripening.',
        },
        {
          title: 'Heavy Trash Mulching Moisture Retention',
          description:
            'Trash retention preserves 40% soil moisture and adds 2.5 tonnes organic biomass per acre.',
        },
        {
          title: 'Early Shoot Borer Suppression',
          description:
            'Earthing-up buries base nodes, physically preventing borer larvae entry points.',
        },
        {
          title: 'Sugar Brix Potential: 19.5%',
          description:
            'Balanced potash ensures optimal sucrose crystallization recovery at the mill.',
        },
      ],
      estimatedSavings: {
        amount: '₹5,200',
        description:
          'Timed completion of nitrogen before monsoon prevented low sugar recovery and post-harvest mill docking.',
      },
    },
    {
      id: 'chickpea',
      name: 'Chickpea (Gram)',
      punjabiName: 'ਛੋਲੇ',
      hindiName: 'चना',
      displayLabel: 'Chickpea (ਛੋਲੇ)',
      variety: 'PBG 8 / PBG 7 (Desi Gram)',
      season: 'Rabi Season · 130 Days',
      currentStage: 'POD DEVELOPMENT & GRAIN FILLING (STAGE · DAY 75)',
      stageBadge: 'POD FILLING',
      modelFile: '/chickpea.glb?v=1',
      modelType: 'glb',
      targetHeight: 0.92,
      color: '#658F42',
      recommendedAction: {
        title: 'Zero Urea Required · Foliar 2% Urea Spray',
        subtext: '0.0 Bags Chemical Nitrogen Needed',
        badge: 'Symbiotic N-Fixing Active',
        description:
          'No chemical soil nitrogen required. Active Rhizobium root nodules are fixing atmospheric nitrogen. Optional 2% urea foliar spray boosts pod filling if terminal heat strikes.',
        pauBenchmark: '15.0 kg N · 40.0 kg P₂O₅ · 0 kg K₂O / ha',
      },
      seasonRequirements: [
        {
          name: 'Rhizobium + PSB Liquid Bio-Fertilizer',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '8.5 packets (1 packet/acre seed treatment)',
          splitProtocol: 'Seed inoculated with jaggery solution prior to sowing',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 25 Oct 2025',
          completed: true,
        },
        {
          name: 'DAP — Diammonium Phosphate (50 kg)',
          status: 'Applied at Sowing ✓',
          statusType: 'completed',
          totalBags: '4 Bags (0.5 bags/acre)',
          splitProtocol: 'Basal placement to energize nodulation ATP cycle',
          dueAmount: 'Completed',
          dueSchedule: 'Applied 25 Oct 2025',
          completed: true,
        },
        {
          name: 'Foliar Potassium & Sulfur Micronutrient',
          status: 'Due Now',
          statusType: 'due',
          totalBags: '1 Spray (Water Soluble 0:0:50 + 17% S)',
          splitProtocol: 'Foliar spray during early pod formation stage',
          dueAmount: '1 Spray Due',
          dueSchedule: 'Due before next canal turn',
          completed: false,
        },
      ],
      agronomicReasoning: [
        {
          title: 'Symbiotic Rhizobium Legume Nodulation',
          description:
            'Root nodules fix 40–50 kg N/ha from the air for free, leaving residual fertility for next crop.',
        },
        {
          title: 'Zero Chemical Nitrogen Excess Guard',
          description:
            'Applying urea to chickpeas suppresses nodules and induces vegetative rankness with zero pods.',
        },
        {
          title: 'Ascochyta Blight & Wilt Resistance',
          description:
            'Balanced phosphorus enables rapid deep taproot development into subsoil water.',
        },
        {
          title: 'Terminal Heat Abatement',
          description:
            'Early morning foliar spray mitigates heat wave desiccation during seed grain filling.',
        },
      ],
      estimatedSavings: {
        amount: '₹6,400',
        description:
          'Natural biological nitrogen fixation completely replaced 15 bags of chemical urea.',
      },
    },
  ],

  // 2D Field Precision Mapping Data for Plot A (8.5 Acres)
  field2D: {
    plotName: 'Plot A — Malwa Central Parcel',
    totalAcres: 8.5,
    gpsCenter: '30.9010° N, 75.8573° E',
    perimeterMeters: 820,
    zones: [
      {
        id: 'zone-1',
        name: 'Zone 1: North Terraced Basin',
        acres: 3.2,
        soilType: 'Sandy Loam',
        nitrogenLevel: 'Low (195 kg/ha)',
        nitrogenColor: '#EF4444', // Red/Alert
        potassiumLevel: 'Very High (330 kg/ha)',
        ph: 7.3,
        moisture: '28% Optimal',
        recommendation: 'Targeted 4.2 bags Urea broadcast; 0 kg Potash needed',
        color: '#FDE047',
      },
      {
        id: 'zone-2',
        name: 'Zone 2: Central Furrow Alluvium',
        acres: 3.5,
        soilType: 'Loam (Balanced Humus)',
        nitrogenLevel: 'Medium-Low (215 kg/ha)',
        nitrogenColor: '#F59E0B', // Amber
        potassiumLevel: 'High (310 kg/ha)',
        ph: 7.4,
        moisture: '31% Field Capacity',
        recommendation: 'Targeted 4.0 bags Urea broadcast along furrows',
        color: '#86EFAC',
      },
      {
        id: 'zone-3',
        name: 'Zone 3: South Canal Border Bed',
        acres: 1.8,
        soilType: 'Clay Loam (Heavy)',
        nitrogenLevel: 'Medium (240 kg/ha)',
        nitrogenColor: '#10B981', // Green
        potassiumLevel: 'High (290 kg/ha)',
        ph: 7.5,
        moisture: '34% High Moisture',
        recommendation: 'Targeted 1.8 bags Urea broadcast; delay watering 24h',
        color: '#6EE7B7',
      },
    ],
    soilProbes: [
      { id: 'P-1', name: 'Probe 1', x: 22, y: 35, n: 190, p: 28, k: 335, ph: 7.3, status: 'N-Deficit' },
      { id: 'P-2', name: 'Probe 2', x: 45, y: 25, n: 210, p: 32, k: 310, ph: 7.4, status: 'Target Balanced' },
      { id: 'P-3', name: 'Probe 3', x: 70, y: 30, n: 245, p: 35, k: 295, ph: 7.5, status: 'Optimal' },
      { id: 'P-4', name: 'Probe 4', x: 30, y: 70, n: 200, p: 30, k: 320, ph: 7.3, status: 'N-Deficit' },
      { id: 'P-5', name: 'Probe 5', x: 55, y: 65, n: 215, p: 34, k: 310, ph: 7.4, status: 'Target Balanced' },
      { id: 'P-6', name: 'Probe 6', x: 80, y: 75, n: 235, p: 36, k: 285, ph: 7.6, status: 'Optimal' },
    ],
  },
};

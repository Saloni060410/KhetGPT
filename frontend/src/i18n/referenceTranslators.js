/**
 * Richa's Reference Table Translators (PRD Feature 11)
 * Maps crops, varieties, growth stages, and fertilizer products to English and Hindi names.
 */

export const CROPS_REFERENCE = {
  wheat: {
    id: 'wheat',
    nameEn: 'Wheat',
    nameHi: 'गेहूं',
    varieties: {
      'hd-2967': { nameEn: 'HD-2967', nameHi: 'एचडी-२९६७' },
      'pbw-343': { nameEn: 'PBW-343', nameHi: 'पीबीडब्ल्यू-३४३' },
      'shriram-super-303': { nameEn: 'Shriram Super 303', nameHi: 'श्रीराम सुपर ३०३' },
    },
    stages: {
      sowing: { nameEn: 'Basal / Sowing', nameHi: 'बुवाई' },
      crown_root_initiation: { nameEn: 'Crown Root Initiation (CRI)', nameHi: 'जड़ विकास (सीआरआई)' },
      tillering: { nameEn: 'Tillering', nameHi: 'कल्ले फूटना' },
      jointing: { nameEn: 'Jointing', nameHi: 'गांठ बनना' },
      flowering: { nameEn: 'Flowering / Heading', nameHi: 'फूल आना / बाली' },
      grain_filling: { nameEn: 'Grain Filling', nameHi: 'दाना भराव' },
    },
  },
  rice: {
    id: 'rice',
    nameEn: 'Paddy / Rice',
    nameHi: 'धान / चावल',
    varieties: {
      'pusa-basmati-1121': { nameEn: 'Pusa Basmati 1121', nameHi: 'पूसा बासमती ११२१' },
      'pr-126': { nameEn: 'PR-126', nameHi: 'पीआर-१२६' },
      swarna: { nameEn: 'Swarna (MTU 7029)', nameHi: 'स्वर्णा' },
    },
    stages: {
      nursery: { nameEn: 'Nursery / Seedling', nameHi: 'पौधशाला' },
      transplanting: { nameEn: 'Transplanting (Basal)', nameHi: 'रोपाई' },
      panicle_initiation: { nameEn: 'Panicle Initiation', nameHi: 'बाली विकास' },
      flowering: { nameEn: 'Flowering', nameHi: 'फूल आना' },
    },
  },
  maize: {
    id: 'maize',
    nameEn: 'Maize (Corn)',
    nameHi: 'मक्का',
    varieties: {
      'dekalb-9108': { nameEn: 'Dekalb 9108 Plus', nameHi: 'डेकाल्ब ९१०८' },
      'pioneer-p3396': { nameEn: 'Pioneer P3396', nameHi: 'पायनियर पी३३९६' },
    },
    stages: {
      sowing: { nameEn: 'Basal / Sowing', nameHi: 'बुवाई' },
      knee_high: { nameEn: 'Knee-high (V6)', nameHi: 'घुटने की ऊंचाई' },
      tasseling: { nameEn: 'Tasseling / Silking', nameHi: 'मंजर / भुट्टा निकलना' },
    },
  },
  cotton: {
    id: 'cotton',
    nameEn: 'Cotton',
    nameHi: 'कपास',
    varieties: {
      'rch-659': { nameEn: 'RCH 659 BG II', nameHi: 'आरसीएच ६५९' },
      jaadu: { nameEn: 'Jaadu BG II', nameHi: 'जादू बीजी २' },
    },
    stages: {
      sowing: { nameEn: 'Basal / Sowing', nameHi: 'बुवाई' },
      vegetative: { nameEn: 'Vegetative Growth', nameHi: 'वानस्पतिक वृद्धि' },
      squaring: { nameEn: 'Squaring (Boll form)', nameHi: 'डोडी बनना' },
      boll_development: { nameEn: 'Boll Development', nameHi: 'टिंडा विकास' },
    },
  },
  soybean: {
    id: 'soybean',
    nameEn: 'Soybean',
    nameHi: 'सोयाबीन',
    varieties: {
      'js-9560': { nameEn: 'JS 9560', nameHi: 'जेएस ९५६०' },
      'js-2034': { nameEn: 'JS 2034', nameHi: 'जेएस २०३४' },
    },
    stages: {
      sowing: { nameEn: 'Basal / Sowing', nameHi: 'बुवाई' },
      vegetative: { nameEn: 'Vegetative (V3)', nameHi: 'वानस्पतिक वृद्धि' },
      pod_initiation: { nameEn: 'Pod Initiation', nameHi: 'फली लगना' },
    },
  },
}

export const FERTILIZERS_REFERENCE = {
  urea: {
    nameEn: 'Urea (46% N)',
    nameHi: 'यूरिया (४६% एन)',
  },
  dap: {
    nameEn: 'Di-Ammonium Phosphate (DAP 18:46:0)',
    nameHi: 'डीएपी (१८:४६:०)',
  },
  mop: {
    nameEn: 'Muriate of Potash (MOP 0:0:60)',
    nameHi: 'एमओपी पोटाश (०:०:६०)',
  },
  npk_10_26_26: {
    nameEn: 'NPK 10:26:26',
    nameHi: 'एनपीके १०:२६:२६',
  },
  ssp: {
    nameEn: 'Single Super Phosphate (SSP 16% P)',
    nameHi: 'एसएसपी (१६% पी)',
  },
}

export const GENERAL_STAGES = {
  sowing: { nameEn: 'Basal / Sowing', nameHi: 'बुवाई' },
  vegetative: { nameEn: 'Vegetative Growth', nameHi: 'वानस्पतिक वृद्धि' },
  tillering: { nameEn: 'Tillering', nameHi: 'कल्ले फूटना' },
  flowering: { nameEn: 'Flowering / Heading', nameHi: 'फूल आना' },
  grain_filling: { nameEn: 'Grain Filling', nameHi: 'दाना भराव' },
  harvesting: { nameEn: 'Harvesting', nameHi: 'कटाई' },
}

/**
 * Get localized crop name
 */
export function getCropName(cropKey, lang = 'en') {
  if (!cropKey) return lang === 'hi' ? 'सामान्य फसल' : 'General Crop'
  const key = String(cropKey).toLowerCase()
  const crop = CROPS_REFERENCE[key]
  if (crop) {
    return lang === 'hi' ? crop.nameHi : crop.nameEn
  }
  return cropKey.charAt(0).toUpperCase() + cropKey.slice(1)
}

/**
 * Get localized variety name
 */
export function getVarietyName(cropKey, varietyKey, lang = 'en') {
  if (!varietyKey) return ''
  const cKey = String(cropKey || '').toLowerCase()
  const vKey = String(varietyKey).toLowerCase()
  const crop = CROPS_REFERENCE[cKey]
  if (crop && crop.varieties[vKey]) {
    return lang === 'hi' ? crop.varieties[vKey].nameHi : crop.varieties[vKey].nameEn
  }
  return varietyKey
}

/**
 * Get localized growth stage name
 */
export function getStageName(stageKey, cropKeyOrLang = 'en', maybeLang) {
  if (!stageKey) return (cropKeyOrLang === 'hi' || maybeLang === 'hi') ? 'सामान्य अवस्था' : 'General Stage'
  const lang = (maybeLang === 'hi' || maybeLang === 'en')
    ? maybeLang
    : (cropKeyOrLang === 'hi' || cropKeyOrLang === 'en')
    ? cropKeyOrLang
    : 'en'
  const cropKey = (cropKeyOrLang !== 'hi' && cropKeyOrLang !== 'en') ? cropKeyOrLang : null

  const sKey = String(stageKey).toLowerCase()
  if (cropKey) {
    const cKey = String(cropKey).toLowerCase()
    const crop = CROPS_REFERENCE[cKey]
    if (crop && crop.stages && crop.stages[sKey]) {
      return lang === 'hi' ? crop.stages[sKey].nameHi : crop.stages[sKey].nameEn
    }
  }

  // Also check if any crop has this stage
  for (const c of Object.values(CROPS_REFERENCE)) {
    if (c.stages && c.stages[sKey]) {
      return lang === 'hi' ? c.stages[sKey].nameHi : c.stages[sKey].nameEn
    }
  }

  if (GENERAL_STAGES[sKey]) {
    return lang === 'hi' ? GENERAL_STAGES[sKey].nameHi : GENERAL_STAGES[sKey].nameEn
  }
  return stageKey.replace(/_/g, ' ')
}

/**
 * Get localized fertilizer product name
 */
export function getFertilizerName(fertKey, lang = 'en') {
  if (!fertKey) return lang === 'hi' ? 'उर्वरक' : 'Fertilizer'
  const key = String(fertKey).toLowerCase()
  const fert = FERTILIZERS_REFERENCE[key]
  if (fert) {
    return lang === 'hi' ? fert.nameHi : fert.nameEn
  }
  return fertKey.toUpperCase()
}

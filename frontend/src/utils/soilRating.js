/**
 * ICAR Standard Soil Fertility Rating Benchmarks for Indian Soils
 * Nitrogen: < 280 (Low), 280-560 (Medium), > 560 (High) [kg/ha]
 * Phosphorus: < 11 (Low), 11-25 (Medium), > 25 (High) [kg/ha]
 * Potassium: < 110 (Low), 110-280 (Medium), > 280 (High) [kg/ha]
 * Organic Carbon: < 0.5% (Low), 0.5-0.75% (Medium), > 0.75% (High)
 * pH: < 6.5 (Acidic), 6.5-7.5 (Neutral / Optimal), > 7.5 (Alkaline)
 */

export function getNutrientRating(nutrient, val) {
  const value = Number(val) || 0
  switch (nutrient?.toLowerCase()) {
    case 'n':
    case 'nitrogen':
      if (value < 280) {
        return { level: 'low', label: 'Low (Deficient)', shortLabel: 'Low', badgeVariant: 'warning', textClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' }
      } else if (value <= 560) {
        return { level: 'medium', label: 'Medium (Optimal)', shortLabel: 'Medium', badgeVariant: 'success', textClass: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' }
      }
      return { level: 'high', label: 'High (Surplus)', shortLabel: 'High', badgeVariant: 'neutral', textClass: 'text-blue-700 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' }

    case 'p':
    case 'phosphorus':
      if (value < 11) {
        return { level: 'low', label: 'Low (Deficient)', shortLabel: 'Low', badgeVariant: 'warning', textClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' }
      } else if (value <= 25) {
        return { level: 'medium', label: 'Medium (Optimal)', shortLabel: 'Medium', badgeVariant: 'success', textClass: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' }
      }
      return { level: 'high', label: 'High (Surplus)', shortLabel: 'High', badgeVariant: 'neutral', textClass: 'text-blue-700 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' }

    case 'k':
    case 'potassium':
      if (value < 110) {
        return { level: 'low', label: 'Low (Deficient)', shortLabel: 'Low', badgeVariant: 'warning', textClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' }
      } else if (value <= 280) {
        return { level: 'medium', label: 'Medium (Optimal)', shortLabel: 'Medium', badgeVariant: 'success', textClass: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' }
      }
      return { level: 'high', label: 'High (Surplus)', shortLabel: 'High', badgeVariant: 'neutral', textClass: 'text-blue-700 dark:text-blue-400', bgClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-800' }

    default:
      return { level: 'medium', label: 'Medium', shortLabel: 'Medium', badgeVariant: 'neutral', textClass: 'text-ink-secondary', bgClass: 'bg-bg-subtle border-border-default' }
  }
}

export function getPhRating(phVal) {
  const ph = Number(phVal) || 7.0
  if (ph < 6.5) {
    return { level: 'acidic', label: 'Acidic', desc: 'Lime application may be advised if pH < 6.0', badgeVariant: 'warning' }
  } else if (ph <= 7.5) {
    return { level: 'neutral', label: 'Neutral (Optimal)', desc: 'Ideal for nutrient uptake and root growth', badgeVariant: 'success' }
  }
  return { level: 'alkaline', label: 'Alkaline', desc: 'Gypsum or sulfur may improve phosphorus uptake', badgeVariant: 'warning' }
}

export function getOrganicCarbonRating(ocVal) {
  const oc = Number(ocVal) || 0.5
  if (oc < 0.5) {
    return { level: 'low', label: 'Low (<0.5%)', desc: 'Depleted soil organic matter; FYM recommended', badgeVariant: 'warning' }
  } else if (oc <= 0.75) {
    return { level: 'medium', label: 'Medium (0.5–0.75%)', desc: 'Moderate organic carbon reserve', badgeVariant: 'success' }
  }
  return { level: 'high', label: 'High (>0.75%)', desc: 'Rich organic matter content', badgeVariant: 'success' }
}

export function getOverallSoilRating(soilTest) {
  if (!soilTest) return { title: 'No Soil Test Recorded', summary: 'Record a soil test to view fertility rating', status: 'unrated' }

  const nRat = getNutrientRating('n', soilTest.n)
  const pRat = getNutrientRating('p', soilTest.p)
  const kRat = getNutrientRating('k', soilTest.k)
  const phRat = getPhRating(soilTest.ph)

  const lowCount = [nRat, pRat, kRat].filter((r) => r.level === 'low').length

  if (lowCount >= 2) {
    return {
      title: 'Low Fertility (Multi-Nutrient Deficit)',
      summary: `Deficient in ${[nRat.level === 'low' ? 'Nitrogen' : '', pRat.level === 'low' ? 'Phosphorus' : '', kRat.level === 'low' ? 'Potassium' : ''].filter(Boolean).join(' & ')}. pH is ${phRat.label}.`,
      status: 'low',
      badgeVariant: 'warning',
    }
  } else if (lowCount === 1) {
    return {
      title: 'Moderate Fertility (Selective Adjustment)',
      summary: `Mainly deficient in ${nRat.level === 'low' ? 'Nitrogen' : pRat.level === 'low' ? 'Phosphorus' : 'Potassium'}. Maintenance required.`,
      status: 'medium',
      badgeVariant: 'neutral',
    }
  }

  return {
    title: 'High Fertility (Balanced Reserves)',
    summary: 'Soil nitrogen, phosphorus and potassium are at or above optimal crop thresholds.',
    status: 'high',
    badgeVariant: 'success',
  }
}

/**
 * Maps a real /fields/:id/recommendations response onto the same shape docketData.js's static
 * PAU reference entries use, so CropInspectorHUD (and everything downstream of it -- the
 * dealer slip, dates modal, specs modal, agronomist chat) can render either one without
 * knowing the difference.
 *
 * Every field below is either a real value from the API, or -- where no real equivalent
 * exists at all (punjabiName translation, 3D model file/color, narrative "Moisture Optimal"-
 * style copy that isn't a claim about any specific field) -- inherited unchanged from the
 * static entry via the `...staticCrop` spread. Nothing here is invented; if the API doesn't
 * have it, the static reference value is kept as-is, not replaced with a guess.
 */
export function buildRealDocketCrop(staticCrop, field, rec, fertilizerNames) {
  const productName = (id) => fertilizerNames[id] || id;

  const nb = rec.explanation?.nutrient_balance || {};
  const pauBenchmarkParts = ['n', 'p', 'k']
    .filter((k) => nb[k] && nb[k].standard_dose_kg_ha != null)
    .map((k) => `${nb[k].standard_dose_kg_ha} kg ${k.toUpperCase()}${k === 'n' ? '' : k === 'p' ? '2O5' : '2O'}/ha`);

  const seasonRequirements = (rec.schedule || []).map((line) => ({
    name: productName(line.fertilizer_type),
    status: line.apply_by ? `Due by ${line.apply_by}` : line.timing_note || 'Not yet dated',
    statusType: 'due',
    totalBags: `${line.quantity_kg_per_acre} kg/acre`,
    splitProtocol: line.timing_note || `Applied at ${line.stage.replace(/_/g, ' ')}`,
    dueAmount: `${line.quantity_kg_per_acre} kg/acre`,
    dueSchedule: line.apply_by ? `Due ${line.apply_by}` : line.stage.replace(/_/g, ' '),
    completed: false,
  }));

  const topFactors = rec.explanation?.top_factors || rec.topFactors || [];
  const agronomicReasoning = topFactors.map((sentence) => ({
    title: sentence.length > 64 ? `${sentence.slice(0, 61)}...` : sentence,
    description: sentence,
  }));

  const saving = rec.estimatedSaving;
  const savingIsPositive = saving != null && saving >= 0;
  const savingAmount = saving != null ? `₹${Math.abs(saving).toFixed(0)}` : null;

  return {
    ...staticCrop,
    variety: field.cropVariety || staticCrop.variety,
    currentStage: (field.growthStage || staticCrop.currentStage || '').toString(),
    stageBadge: (field.growthStage || staticCrop.stageBadge || '').toString().toUpperCase(),
    recommendedAction: {
      badge: rec.risk?.level || staticCrop.recommendedAction.badge,
      title: `Apply ${rec.quantityKgPerAcre} kg/acre ${productName(rec.fertilizerType)}`,
      subtext: rec.estimatedCost != null ? `Est. ₹${rec.estimatedCost.toFixed(0)}/acre` : staticCrop.recommendedAction.subtext,
      description: topFactors[0] || rec.risk?.reason || staticCrop.recommendedAction.description,
      pauBenchmark: pauBenchmarkParts.length ? pauBenchmarkParts.join(' · ') : staticCrop.recommendedAction.pauBenchmark,
    },
    seasonRequirements: seasonRequirements.length ? seasonRequirements : staticCrop.seasonRequirements,
    agronomicReasoning: agronomicReasoning.length ? agronomicReasoning : staticCrop.agronomicReasoning,
    estimatedSavings: savingAmount
      ? {
          amount: savingAmount,
          isPositive: savingIsPositive,
          description: savingIsPositive
            ? `Compared to your last logged application for this field, this plan is estimated to cost ${savingAmount} less per acre.`
            : `This plan costs ${savingAmount} more per acre than your last logged application -- the field genuinely needs more than was applied last time, not a calibration error.`,
        }
      : staticCrop.estimatedSavings,
  };
}

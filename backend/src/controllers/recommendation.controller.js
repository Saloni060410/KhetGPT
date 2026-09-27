import { prisma } from '../config/db.js'
import { getWeather } from '../services/weatherService.js'
import { recommend } from '../services/mlService.js'

const RISK_LEVEL_MAP = { low: 'LOW', medium: 'MEDIUM', high: 'HIGH' }
const isoDate = (date) => date.toISOString().slice(0, 10)

function toApiRecommendation(row) {
  return {
    id: row.id,
    fieldId: row.fieldId,
    cropType: row.cropType,
    cropVariety: row.cropVariety,
    growthStage: row.growthStage,
    fertilizerType: row.fertilizerType,
    quantityKgPerAcre: row.quantityKgPerAcre,
    schedule: row.schedule,
    risk: {
      level: row.riskLevel,
      reason: row.riskReason,
      soilHealthImpact: row.soilHealthImpact,
      yieldImpact: row.yieldImpact,
    },
    topFactors: row.topFactors,
    explanation: row.explanation,
    weatherSource: row.weatherSource,
    estimatedCost: row.estimatedCost,
    estimatedSaving: row.estimatedSaving,
    modelVersion: row.modelVersion,
    createdAt: row.createdAt,
  }
}

export async function createRecommendation(req, res, next) {
  try {
    const field = req.field // set by assertFieldOwner

    if (!field.cropType) {
      return res.status(409).json({ error: 'Field has no crop type set' })
    }
    if (!field.growthStage) {
      return res.status(409).json({ error: 'Field has no growth stage set' })
    }

    const soilTest = await prisma.soilTest.findFirst({
      where: { fieldId: field.id },
      orderBy: { testedOn: 'desc' },
    })
    if (!soilTest) {
      return res.status(409).json({ error: 'Field has no soil test' })
    }

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const fertilizerLogs = await prisma.fertilizerLog.findMany({
      where: { fieldId: field.id, appliedOn: { gte: twelveMonthsAgo } },
      orderBy: { appliedOn: 'asc' },
    })

    const weather = await getWeather({ latitude: field.latitude, longitude: field.longitude })

    const payload = {
      field_id: field.id,
      crop_type: field.cropType,
      variety: field.cropVariety ?? null,
      irrigation: field.irrigation ?? 'irrigated',
      growth_stage: field.growthStage,
      sowing_date: field.sowingDate ? isoDate(field.sowingDate) : null,
      soil: {
        n: soilTest.n,
        p: soilTest.p,
        k: soilTest.k,
        ph: soilTest.ph,
        organic_carbon: soilTest.organicCarbon,
        moisture: soilTest.moisture,
      },
      weather: {
        temperature_c: weather.temperature_c,
        humidity_pct: weather.humidity_pct,
        rainfall_mm_forecast: weather.rainfall_mm_forecast,
        source: weather.source,
      },
      previous_fertilizer_usage: fertilizerLogs.map((log) => ({
        type: log.type,
        quantity_kg_per_acre: log.quantityKgPerAcre,
        applied_on: isoDate(log.appliedOn),
      })),
    }

    const mlResult = await recommend(payload)

    const created = await prisma.recommendation.create({
      data: {
        fieldId: field.id,
        soilTestId: soilTest.id,
        cropType: field.cropType,
        cropVariety: field.cropVariety ?? null,
        growthStage: field.growthStage,
        fertilizerType: mlResult.recommendation.fertilizer_type,
        quantityKgPerAcre: mlResult.recommendation.quantity_kg_per_acre,
        schedule: mlResult.recommendation.schedule,
        riskLevel: RISK_LEVEL_MAP[mlResult.risk.level],
        riskReason: mlResult.risk.reason,
        soilHealthImpact: mlResult.risk.soil_health_impact,
        yieldImpact: mlResult.risk.yield_impact,
        explanation: mlResult.explanation,
        weatherSource: weather.source,
        inputSnapshot: payload,
        topFactors: mlResult.explanation.top_factors,
        estimatedCost: mlResult.cost.estimated_cost_inr_per_acre,
        estimatedSaving: mlResult.cost.saving_inr_per_acre,
        modelVersion: mlResult.model_version,
      },
    })

    res.status(201).json(toApiRecommendation(created))
  } catch (err) {
    next(err)
  }
}
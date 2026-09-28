import { z } from 'zod'
import { prisma } from '../config/db.js'
import { getWeatherForField } from '../services/weatherService.js'
import { getFertilizers } from '../services/referenceService.js'
import { riskScore, MlPayloadError } from '../services/mlService.js'

const isoDate = (date) => date.toISOString().slice(0, 10)

export const riskCheckSchema = z.object({
  plannedApplication: z
    .array(
      z.object({
        fertilizerType: z.string().min(1),
        quantityKgPerAcre: z.number().positive(),
      })
    )
    .min(1),
})

export async function checkRisk(req, res, next) {
  try {
    const field = req.field
    const { plannedApplication } = req.body

    if (!field.cropType) return res.status(409).json({ error: 'Field has no crop type set' })
    if (!field.growthStage) return res.status(409).json({ error: 'Field has no growth stage set' })

    const soilTest = await prisma.soilTest.findFirst({
      where: { fieldId: field.id },
      orderBy: { testedOn: 'desc' },
    })
    if (!soilTest) return res.status(409).json({ error: 'Field has no soil test' })

    const fertilizers = await getFertilizers()
    const validIds = new Set(fertilizers.map((f) => f.id))
    for (const item of plannedApplication) {
      if (!validIds.has(item.fertilizerType)) {
        return res.status(400).json({ error: `Unknown fertilizerType: ${item.fertilizerType}` })
      }
    }

    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const fertilizerLogs = await prisma.fertilizerLog.findMany({
      where: { fieldId: field.id, appliedOn: { gte: twelveMonthsAgo } },
      orderBy: { appliedOn: 'asc' },
    })

    const weather = await getWeatherForField({ id: field.id, latitude: field.latitude, longitude: field.longitude })

    const payload = {
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
      planned_application: plannedApplication.map((item) => ({
        fertilizer_type: item.fertilizerType,
        quantity_kg_per_acre: item.quantityKgPerAcre,
      })),
    }

    let result
    try {
      result = await riskScore(payload)
    } catch (err) {
      if (err instanceof MlPayloadError) {
        return res.status(400).json({ error: err.message, detail: err.detail })
      }
      throw err
    }

    res.json({
      risk: {
        level: result.risk.level,
        reason: result.risk.reason,
        soilHealthImpact: result.risk.soil_health_impact,
        yieldImpact: result.risk.yield_impact,
        overApplicationPct: result.risk.over_application_pct,
      },
      nutrientBalance: {
        n: {
          appliedKgHa: result.nutrient_balance.n.applied_kg_ha,
          recommendedKgHa: result.nutrient_balance.n.recommended_kg_ha,
          ratio: result.nutrient_balance.n.ratio,
        },
        p: {
          appliedKgHa: result.nutrient_balance.p.applied_kg_ha,
          recommendedKgHa: result.nutrient_balance.p.recommended_kg_ha,
          ratio: result.nutrient_balance.p.ratio,
        },
        k: {
          appliedKgHa: result.nutrient_balance.k.applied_kg_ha,
          recommendedKgHa: result.nutrient_balance.k.recommended_kg_ha,
          ratio: result.nutrient_balance.k.ratio,
        },
      },
    })
  } catch (err) {
    next(err)
  }
}
import { prisma } from '../config/db.js'
import { getFertilizers } from '../services/referenceService.js'

const DEFAULT_WINDOW_MONTHS = 24

export async function getFieldTrends(req, res, next) {
  try {
    const field = req.field
    const windowStart = new Date()
    windowStart.setMonth(windowStart.getMonth() - DEFAULT_WINDOW_MONTHS)

    // Three independent, single-query series — no per-row awaits.
    const [soilTests, fertilizerLogs, recommendations, fertilizers] = await Promise.all([
      prisma.soilTest.findMany({
        where: { fieldId: field.id, testedOn: { gte: windowStart } },
        orderBy: { testedOn: 'asc' },
        select: { testedOn: true, n: true, p: true, k: true, ph: true, organicCarbon: true, moisture: true },
      }),
      prisma.fertilizerLog.findMany({
        where: { fieldId: field.id, appliedOn: { gte: windowStart } },
        orderBy: { appliedOn: 'asc' },
      }),
      prisma.recommendation.findMany({
        where: { fieldId: field.id, createdAt: { gte: windowStart } },
        orderBy: { createdAt: 'asc' },
        select: {
          createdAt: true,
          fertilizerType: true,
          quantityKgPerAcre: true,
          estimatedCost: true,
          riskLevel: true,
          explanation: true,
        },
      }),
      getFertilizers(),
    ])

    const fertilizerById = new Map(fertilizers.map((f) => [f.id, f]))

    const monthly = new Map() // 'YYYY-MM' -> { nitrogenKgAcre, p2o5KgAcre, k2oKgAcre, costInr }
    for (const log of fertilizerLogs) {
      const month = log.appliedOn.toISOString().slice(0, 7)
      const product = fertilizerById.get(log.type)
      const entry = monthly.get(month) ?? { month, nitrogenKgAcre: 0, p2o5KgAcre: 0, k2oKgAcre: 0, costInr: 0 }

      if (product) {
        entry.nitrogenKgAcre += log.quantityKgPerAcre * (product.n_pct / 100)
        entry.p2o5KgAcre += log.quantityKgPerAcre * (product.p2o5_pct / 100)
        entry.k2oKgAcre += log.quantityKgPerAcre * (product.k2o_pct / 100)
        entry.costInr += log.quantityKgPerAcre * (product.price_inr_per_kg ?? 0)
      }

      monthly.set(month, entry)
    }

    res.json({
      soilTests: soilTests.map((row) => ({
        testedOn: row.testedOn,
        n: row.n,
        p: row.p,
        k: row.k,
        ph: row.ph,
        organicCarbon: row.organicCarbon,
        moisture: row.moisture,
      })),
      applied: [...monthly.values()].sort((a, b) => a.month.localeCompare(b.month)),
      recommendations: recommendations.map((row) => ({
        createdAt: row.createdAt,
        fertilizerType: row.fertilizerType,
        quantityKgPerAcre: row.quantityKgPerAcre,
        estimatedCost: row.estimatedCost,
        riskLevel: row.riskLevel,
        fertilizerNeededN: row.explanation?.nutrient_balance?.n?.fertilizer_needed_kg_ha ?? null,
        fertilizerNeededP: row.explanation?.nutrient_balance?.p?.fertilizer_needed_kg_ha ?? null,
        fertilizerNeededK: row.explanation?.nutrient_balance?.k?.fertilizer_needed_kg_ha ?? null,
      })),
    })
  } catch (err) {
    next(err)
  }
}
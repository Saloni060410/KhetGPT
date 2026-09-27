import { create } from 'zustand'
import * as endpoints from '../services/endpoints.js'

export const useRecommendationStore = create((set, get) => ({
  recommendations: [],
  currentRecommendation: null,
  weather: null,
  trends: null,
  riskCheckResult: null,
  isLoading: false,
  error: null,

  fetchWeather: async (fieldId) => {
    try {
      const weather = await endpoints.getFieldWeather(fieldId)
      set({ weather })
      return weather
    } catch {
      // Degrades gracefully per PRD NFR rules
      return null
    }
  },

  generateRecommendation: async (fieldId, payload) => {
    set({ isLoading: true, error: null })
    try {
      const recommendation = await endpoints.createRecommendation(fieldId, payload)
      set((state) => ({
        currentRecommendation: recommendation,
        recommendations: [recommendation, ...state.recommendations],
        isLoading: false,
      }))
      return recommendation
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to generate recommendation' })
      throw err
    }
  },

  fetchRecommendations: async (fieldId, params) => {
    set({ isLoading: true, error: null })
    try {
      const res = await endpoints.getRecommendations(fieldId, params)
      const items = res?.items || (Array.isArray(res) ? res : [])
      const pagination = {
        page: res?.page || 1,
        limit: res?.limit || items.length,
        total: res?.total != null ? res.total : items.length,
      }
      set({
        recommendations: items,
        currentRecommendation: items[0] || get().currentRecommendation,
        isLoading: false,
      })
      return { items, ...pagination }
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to fetch recommendations' })
      throw err
    }
  },

  fetchRecommendationById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const rec = await endpoints.getRecommendationById(id)
      set({ currentRecommendation: rec, isLoading: false })
      return rec
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to load recommendation' })
      throw err
    }
  },

  checkPlannedRisk: async (fieldId, plannedApplication) => {
    set({ isLoading: true, error: null })
    try {
      const result = await endpoints.checkRisk(fieldId, { plannedApplication })
      set({ riskCheckResult: result, isLoading: false })
      return result
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to calculate dose risk' })
      throw err
    }
  },

  fetchTrends: async (fieldId) => {
    set({ isLoading: true, error: null })
    try {
      const trends = await endpoints.getFieldTrends(fieldId)
      set({ trends, isLoading: false })
      return trends
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to load field trends' })
      throw err
    }
  },

  setCurrentRecommendation: (rec) => set({ currentRecommendation: rec }),
  clearError: () => set({ error: null }),
}))

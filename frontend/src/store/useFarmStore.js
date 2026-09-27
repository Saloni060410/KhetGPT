import { create } from 'zustand'
import * as endpoints from '../services/endpoints.js'

export const useFarmStore = create((set, get) => ({
  farms: [],
  currentFarm: null,
  fields: [],
  currentField: null,
  isLoading: false,
  error: null,

  fetchFarms: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const res = await endpoints.getFarms(params)
      const items = res?.items || (Array.isArray(res) ? res : [])
      set({ farms: items, isLoading: false })
      return items
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to fetch farms' })
      throw err
    }
  },

  createFarm: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newFarm = await endpoints.createFarm(data)
      set((state) => ({
        farms: [newFarm, ...state.farms],
        currentFarm: newFarm,
        isLoading: false,
      }))
      return newFarm
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to create farm' })
      throw err
    }
  },

  createFarmOptimistic: async (data) => {
    const tempId = `temp-farm-${Date.now()}`
    const tempFarm = {
      id: tempId,
      name: data.name,
      createdAt: new Date().toISOString(),
      fieldsCount: 0,
      _isOptimistic: true,
    }

    // 1. Optimistic apply
    set((state) => ({
      farms: [tempFarm, ...state.farms],
      error: null,
    }))

    try {
      // 2. Perform network request
      const serverFarm = await endpoints.createFarm(data)
      // 3. Reconcile temporary entity with server entity
      set((state) => ({
        farms: state.farms.map((f) => (f.id === tempId ? serverFarm : f)),
        currentFarm: state.currentFarm?.id === tempId ? serverFarm : state.currentFarm,
      }))
      return serverFarm
    } catch (err) {
      // 4. Rollback on failure
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create farm'
      set((state) => ({
        farms: state.farms.filter((f) => f.id !== tempId),
        error: errorMsg,
      }))
      throw err
    }
  },

  deleteFarm: async (farmId) => {
    set({ isLoading: true, error: null })
    try {
      await endpoints.deleteFarm(farmId)
      set((state) => ({
        farms: state.farms.filter((f) => String(f.id) !== String(farmId)),
        fields: state.fields.filter((f) => String(f.farmId) !== String(farmId)),
        currentFarm: state.currentFarm?.id === farmId ? null : state.currentFarm,
        isLoading: false,
      }))
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to delete farm' })
      throw err
    }
  },

  deleteFarmOptimistic: async (farmId) => {
    // 1. Snapshot previous state for rollback
    const previousFarms = [...get().farms]
    const previousFields = [...get().fields]
    const previousCurrentFarm = get().currentFarm

    // 2. Optimistic remove
    set((state) => ({
      farms: state.farms.filter((f) => String(f.id) !== String(farmId)),
      fields: state.fields.filter((f) => String(f.farmId) !== String(farmId)),
      currentFarm: String(state.currentFarm?.id) === String(farmId) ? null : state.currentFarm,
      error: null,
    }))

    try {
      // 3. Network call
      await endpoints.deleteFarm(farmId)
    } catch (err) {
      // 4. Rollback on error
      const errorMsg = err.response?.data?.error || err.message || 'Failed to delete farm'
      set({
        farms: previousFarms,
        fields: previousFields,
        currentFarm: previousCurrentFarm,
        error: errorMsg,
      })
      throw err
    }
  },

  fetchFarm: async (farmId) => {
    set({ isLoading: true, error: null })
    try {
      const farm = await endpoints.getFarmById(farmId)
      set({
        currentFarm: farm,
        fields: farm.fields || get().fields,
        isLoading: false,
      })
      return farm
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to fetch farm details' })
      throw err
    }
  },

  fetchFields: async (farmId, params) => {
    set({ isLoading: true, error: null })
    try {
      const res = await endpoints.getFields(farmId, params)
      const items = res?.items || (Array.isArray(res) ? res : [])
      set({ fields: items, isLoading: false })
      return items
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to fetch fields' })
      throw err
    }
  },

  createField: async (farmId, data) => {
    set({ isLoading: true, error: null })
    try {
      const newField = await endpoints.createField(farmId, data)
      set((state) => ({
        fields: [newField, ...state.fields],
        currentField: newField,
        farms: state.farms.map((f) =>
          String(f.id) === String(farmId)
            ? { ...f, fieldsCount: (f.fieldsCount || 0) + 1 }
            : f,
        ),
        isLoading: false,
      }))
      return newField
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to create field' })
      throw err
    }
  },

  createFieldOptimistic: async (farmId, data) => {
    const tempId = `temp-field-${Date.now()}`
    const tempField = {
      id: tempId,
      farmId,
      ...data,
      createdAt: new Date().toISOString(),
      _isOptimistic: true,
    }

    // 1. Optimistic apply
    set((state) => ({
      fields: [tempField, ...state.fields],
      farms: state.farms.map((f) =>
        String(f.id) === String(farmId)
          ? { ...f, fieldsCount: (f.fieldsCount || 0) + 1 }
          : f,
      ),
      error: null,
    }))

    try {
      // 2. Perform network request
      const serverField = await endpoints.createField(farmId, data)
      // 3. Reconcile temporary entity with server response
      set((state) => ({
        fields: state.fields.map((f) => (f.id === tempId ? serverField : f)),
        currentField: state.currentField?.id === tempId ? serverField : state.currentField,
      }))
      return serverField
    } catch (err) {
      // 4. Rollback on failure
      const errorMsg = err.response?.data?.error || err.message || 'Failed to create field'
      set((state) => ({
        fields: state.fields.filter((f) => f.id !== tempId),
        farms: state.farms.map((f) =>
          String(f.id) === String(farmId)
            ? { ...f, fieldsCount: Math.max(0, (f.fieldsCount || 1) - 1) }
            : f,
        ),
        error: errorMsg,
      }))
      throw err
    }
  },

  fetchField: async (fieldId) => {
    set({ isLoading: true, error: null })
    try {
      const field = await endpoints.getFieldById(fieldId)
      set({ currentField: field, isLoading: false })
      return field
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to fetch field details' })
      throw err
    }
  },

  updateField: async (fieldId, data) => {
    set({ isLoading: true, error: null })
    try {
      const updated = await endpoints.updateField(fieldId, data)
      set((state) => ({
        currentField: { ...state.currentField, ...updated },
        fields: state.fields.map((f) => (String(f.id) === String(fieldId) ? { ...f, ...updated } : f)),
        isLoading: false,
      }))
      return updated
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Failed to update field' })
      throw err
    }
  },

  updateFieldOptimistic: async (fieldId, data) => {
    const previousField = get().currentField
    const previousFields = [...get().fields]

    // 1. Optimistic apply
    set((state) => ({
      currentField: state.currentField ? { ...state.currentField, ...data } : null,
      fields: state.fields.map((f) =>
        String(f.id) === String(fieldId) ? { ...f, ...data } : f,
      ),
      error: null,
    }))

    try {
      // 2. Perform request
      const updated = await endpoints.updateField(fieldId, data)
      // 3. Sync server response
      set((state) => ({
        currentField: state.currentField ? { ...state.currentField, ...updated } : updated,
        fields: state.fields.map((f) =>
          String(f.id) === String(fieldId) ? { ...f, ...updated } : f,
        ),
      }))
      return updated
    } catch (err) {
      // 4. Rollback
      const errorMsg = err.response?.data?.error || err.message || 'Failed to update field'
      set({
        currentField: previousField,
        fields: previousFields,
        error: errorMsg,
      })
      throw err
    }
  },

  setCurrentFarm: (farm) => set({ currentFarm: farm }),
  setCurrentField: (field) => set({ currentField: field }),
  clearError: () => set({ error: null }),
}))

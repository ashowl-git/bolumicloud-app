'use client'

import { useState, useCallback } from 'react'
import { useApiClient } from '@/lib/api'
import type {
  ComplexInfo,
  PerformanceBuilding,
  HousingUnit,
  PerformanceGrades,
  GradeInput,
  PerformanceResult,
} from '@/lib/types/performance'

export type PerformancePhase = 'editing' | 'calculating' | 'completed' | 'error'

const DEFAULT_GRADE: GradeInput = {
  grade: 3,
  method: 'manual',
  evidence: '',
  notes: '',
  calculatedValue: null,
}

const DEFAULT_GRADES: PerformanceGrades = {
  noise_bathroom: { ...DEFAULT_GRADE },
  noise_heavyweight: { ...DEFAULT_GRADE },
  noise_lightweight: { ...DEFAULT_GRADE },
  noise_wall: { ...DEFAULT_GRADE },
  struct_adaptability: { ...DEFAULT_GRADE },
  struct_durability: { ...DEFAULT_GRADE },
  struct_private: { ...DEFAULT_GRADE },
  struct_public: { ...DEFAULT_GRADE },
  env_living: { ...DEFAULT_GRADE, method: 'auto' },
  env_nature: { ...DEFAULT_GRADE },
  fire_evacuation: { ...DEFAULT_GRADE },
  fire_resistance: { ...DEFAULT_GRADE },
  fire_detection: { ...DEFAULT_GRADE },
  mgmt_private: { ...DEFAULT_GRADE },
  mgmt_public: { ...DEFAULT_GRADE },
  energy: { ...DEFAULT_GRADE },
}

export interface UsePerformanceGradeReturn {
  phase: PerformancePhase
  projectId: string | null
  complexInfo: ComplexInfo
  buildings: PerformanceBuilding[]
  units: HousingUnit[]
  grades: PerformanceGrades
  buildingPairs: { fromId: string; toId: string; distance: number }[]
  results: PerformanceResult | null
  error: string | null
  setComplexInfo: (info: Partial<ComplexInfo>) => void
  setBuildings: (buildings: PerformanceBuilding[]) => void
  setUnits: (units: HousingUnit[]) => void
  setGrade: (key: keyof PerformanceGrades, grade: Partial<GradeInput>) => void
  setBuildingPairs: (pairs: { fromId: string; toId: string; distance: number }[]) => void
  calculate: () => Promise<void>
  createProject: () => Promise<void>
  reset: () => void
}

export function usePerformanceGrade(_apiUrl: string): UsePerformanceGradeReturn {
  const api = useApiClient()
  const [phase, setPhase] = useState<PerformancePhase>('editing')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [complexInfo, setComplexInfoState] = useState<ComplexInfo>({
    name: '',
    address: '',
    totalUnits: 500,
    constructionCompany: '',
    designFirm: '',
    siteArea: 0,
    buildingCoverage: 0,
    floorAreaRatio: 0,
    latitude: 37.5665,
    longitude: 126.978,
  })
  const [buildings, setBuildings] = useState<PerformanceBuilding[]>([])
  const [units, setUnits] = useState<HousingUnit[]>([])
  const [grades, setGrades] = useState<PerformanceGrades>(DEFAULT_GRADES)
  const [buildingPairs, setBuildingPairs] = useState<{ fromId: string; toId: string; distance: number }[]>([])
  const [results, setResults] = useState<PerformanceResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const setComplexInfo = useCallback((partial: Partial<ComplexInfo>) => {
    setComplexInfoState((prev) => ({ ...prev, ...partial }))
  }, [])

  const setGrade = useCallback((key: keyof PerformanceGrades, partial: Partial<GradeInput>) => {
    setGrades((prev) => ({
      ...prev,
      [key]: { ...prev[key], ...partial },
    }))
  }, [])

  const createProject = useCallback(async () => {
    try {
      const data = await api.post('/performance/projects', {
        complex_info: {
          name: complexInfo.name,
          address: complexInfo.address,
          total_units: complexInfo.totalUnits,
          construction_company: complexInfo.constructionCompany,
          design_firm: complexInfo.designFirm,
          site_area: complexInfo.siteArea,
          building_coverage: complexInfo.buildingCoverage,
          floor_area_ratio: complexInfo.floorAreaRatio,
          latitude: complexInfo.latitude,
          longitude: complexInfo.longitude,
        },
      })
      setProjectId(data.project_id)
    } catch (e) {
      setError(e instanceof Error ? e.message : '프로젝트 생성 오류')
    }
  }, [api, complexInfo])

  const calculate = useCallback(async () => {
    if (!projectId) {
      await createProject()
    }

    setPhase('calculating')
    setError(null)

    const toSnake = (g: GradeInput) => ({
      grade: g.grade,
      method: g.method,
      evidence: g.evidence,
      notes: g.notes,
      calculated_value: g.calculatedValue,
    })

    const payload = {
      buildings: buildings.map((b) => ({
        id: b.id,
        name: b.name,
        stories: b.stories,
        height: b.height,
        orientation: b.orientation,
      })),
      units: units.map((u) => ({
        id: u.id,
        building_id: u.buildingId,
        unit_type: u.unitType,
        floor: u.floor,
        area: u.area,
        living_room_area: u.livingRoomArea,
        window_area: u.windowArea,
        window_transmittance: u.windowTransmittance,
        facing_building_id: u.facingBuildingId,
        separation_distance: u.separationDistance,
        daylight_factor: u.daylightFactor,
      })),
      grades: Object.fromEntries(
        Object.entries(grades).map(([k, v]) => [k, toSnake(v)])
      ),
      building_pairs: buildingPairs.map((p) => ({
        from_id: p.fromId,
        to_id: p.toId,
        distance: p.distance,
      })),
    }

    try {
      const pid = projectId || `hp-temp-${Date.now()}`
      const data: PerformanceResult = await api.post(`/performance/projects/${pid}/calculate`, payload)
      setResults(data)
      setPhase('completed')
    } catch (e) {
      setError(e instanceof Error ? e.message : '산출 오류')
      setPhase('error')
    }
  }, [api, projectId, buildings, units, grades, buildingPairs, createProject])

  const reset = useCallback(() => {
    setPhase('editing')
    setProjectId(null)
    setComplexInfoState({
      name: '', address: '', totalUnits: 500,
      constructionCompany: '', designFirm: '',
      siteArea: 0, buildingCoverage: 0, floorAreaRatio: 0,
      latitude: 37.5665, longitude: 126.978,
    })
    setBuildings([])
    setUnits([])
    setGrades(DEFAULT_GRADES)
    setBuildingPairs([])
    setResults(null)
    setError(null)
  }, [])

  return {
    phase, projectId, complexInfo, buildings, units, grades,
    buildingPairs, results, error,
    setComplexInfo, setBuildings, setUnits, setGrade, setBuildingPairs,
    calculate, createProject, reset,
  }
}

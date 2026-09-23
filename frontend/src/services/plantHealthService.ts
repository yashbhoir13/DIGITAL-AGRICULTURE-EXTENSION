import api from './api'

export interface PlantHealthPrediction {
  success: boolean
  plant: string
  status: 'Healthy' | 'Diseased' | 'Unknown'
  disease: string | null
  confidence: number
  recommendation: string
  scan_id?: number
  mode?: string
  note?: string
  created_at?: string
}

export interface PlantHealthScanItem {
  id: number
  plant_name: string
  status: 'Healthy' | 'Diseased' | 'Unknown'
  disease: string | null
  confidence: number
  recommendation: string
  mode: string
  created_at: string
}

export interface PlantHealthHistoryResponse {
  scans: PlantHealthScanItem[]
}

export async function predictPlantHealth(file: File | Blob): Promise<PlantHealthPrediction> {
  const formData = new FormData()
  if (file instanceof File) {
    formData.append('file', file, file.name)
  } else {
    formData.append('file', file, 'camera_capture.jpg')
  }

  const { data } = await api.post<PlantHealthPrediction>('/plant-health/predict', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
  return data
}

export async function getPlantHealthHistory(): Promise<PlantHealthScanItem[]> {
  const { data } = await api.get<PlantHealthHistoryResponse>('/plant-health/history')
  return data.scans
}

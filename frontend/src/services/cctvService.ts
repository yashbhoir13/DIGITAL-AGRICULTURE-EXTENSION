import api from './api'

export interface CCTVCamera {
  id: string
  name: string
  location: string
  resolution: string
  status: string
  coverage: string
  default_source: string
  paired_crop?: string
}

export interface PlantDetectionItem {
  id: string
  class: string
  confidence: number
  bbox: [number, number, number, number]
  safety_zone: [number, number, number, number]
}

export interface PlantThreatRelationship {
  threat_label: string
  threat_category: string
  plant_id: string
  plant_class: string
  distance_px: number
  proximity_level: string
  threat_level: 'CRITICAL' | 'HIGH' | 'WARNING' | 'MEDIUM' | 'SAFE'
  harm: string
  action: string
  confidence: number
  bbox: [number, number, number, number]
  plant_bbox: [number, number, number, number]
}

export interface CCTVAnalysisResult {
  camera_id: string
  timestamp: string
  engine: string
  risk_level: 'CRITICAL' | 'WARNING' | 'SAFE'
  status: 'CRITICAL' | 'WARNING' | 'SAFE'
  danger_score: number
  trigger_alarm: boolean
  plants_count: number
  threats_count: number
  plants: PlantDetectionItem[]
  threats: PlantThreatRelationship[]
  relationships: PlantThreatRelationship[]
  temporal_confirmed: boolean
  temporal_frames_matched: string
  annotated_frame_base64: string
  alert_message: string
}

export interface IncidentRecord {
  id: string
  timestamp: string
  camera_id: string
  threat_level: string
  threat_type: string
  plant_id?: string
  confidence: number
  danger_score: number
  harm_description: string
  action_taken: string
  status: string
  snapshot?: string | null
}

export interface CCTVStats {
  cameras_online: number
  total_cameras: number
  active_threats: number
  total_incidents_logged: number
  overall_risk_level: string
}

export async function fetchCCTVCameras(): Promise<CCTVCamera[]> {
  const { data } = await api.get('/cctv/cameras')
  return data.cameras
}

export async function addCCTVCamera(input: {
  name: string
  location: string
  resolution?: string
  paired_crop?: string
  coverage?: string
}): Promise<CCTVCamera> {
  const { data } = await api.post('/cctv/cameras', input)
  return data.camera
}

export async function deleteCCTVCamera(cameraId: string): Promise<void> {
  await api.delete(`/cctv/cameras/${cameraId}`)
}

export async function fetchThreatLogs(): Promise<IncidentRecord[]> {
  const { data } = await api.get('/cctv/threat-log')
  return data.incidents
}

export async function resolveAlert(alertId: string): Promise<IncidentRecord> {
  const { data } = await api.post(`/cctv/alerts/${alertId}/resolve`)
  return data.alert
}

export async function fetchCCTVStats(): Promise<CCTVStats> {
  const { data } = await api.get('/cctv/stats')
  return data
}

export async function analyzeCCTVImage(
  file: File,
  cameraId = 'CAM-01',
  confidence = 0.25,
  safetyZonePx = 50
): Promise<CCTVAnalysisResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('camera_id', cameraId)
  form.append('confidence', confidence.toString())
  form.append('safety_zone_px', safetyZonePx.toString())
  const { data } = await api.post('/cctv/analyze-frame', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function analyzeBase64Frame(
  imageBase64: string,
  cameraId = 'CAM-01',
  confidence = 0.25,
  safetyZonePx = 50
): Promise<CCTVAnalysisResult> {
  const { data } = await api.post('/cctv/analyze-base64', {
    image_base64: imageBase64,
    camera_id: cameraId,
    confidence,
    safety_zone_px: safetyZonePx,
  })
  return data
}

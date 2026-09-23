import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Video,
  Camera,
  Upload,
  AlertTriangle,
  ShieldCheck,
  Volume2,
  VolumeX,
  Play,
  Square,
  RefreshCw,
  Eye,
  Sliders,
  History,
  Activity,
  Layers,
  Zap,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  QrCode,
  Sparkles,
  Search,
  Radio,
  Share2,
} from 'lucide-react'
import {
  fetchCCTVCameras,
  fetchThreatLogs,
  addCCTVCamera,
  deleteCCTVCamera,
  resolveAlert,
  analyzeCCTVImage,
  analyzeBase64Frame,
  CCTVCamera,
  CCTVAnalysisResult,
  IncidentRecord,
} from '../services/cctvService'
import { useLanguage } from '../context/LanguageContext'

export default function CCTVMonitoring() {
  const { t } = useLanguage()
  const [cameras, setCameras] = useState<CCTVCamera[]>([])
  const [selectedCamId, setSelectedCamId] = useState<string>('CAM-01')
  const [mode, setMode] = useState<'device' | 'simulated' | 'upload'>('simulated')
  const [confidence, setConfidence] = useState<number>(0.25)
  const [safetyZonePx, setSafetyZonePx] = useState<number>(50)
  const [audioAlarmEnabled, setAudioAlarmEnabled] = useState<boolean>(true)
  const [autoDetect, setAutoDetect] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  // Camera stream & canvas state
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')

  // Analysis & Alert state
  const [analysis, setAnalysis] = useState<CCTVAnalysisResult | null>(null)
  const [incidentLog, setIncidentLog] = useState<IncidentRecord[]>([])
  const [activeTab, setActiveTab] = useState<'live' | 'alerts' | 'cameras'>('live')
  const [logFilter, setLogFilter] = useState<string>('ALL')
  const [selectedSnapshot, setSelectedSnapshot] = useState<IncidentRecord | null>(null)

  // Camera Management Modal
  const [showAddCamModal, setShowAddCamModal] = useState<boolean>(false)
  const [showPairingModal, setShowPairingModal] = useState<boolean>(false)
  const [newCam, setNewCam] = useState({
    name: 'South Tomato Greenhouse',
    location: 'Sector 4 Polyhouse',
    resolution: '1080p FHD',
    paired_crop: 'Tomato',
    coverage: 'Canopy & drip manifold',
  })

  // Audio synthesizer for alarm
  const audioCtxRef = useRef<AudioContext | null>(null)

  const playAlarmSound = useCallback(() => {
    if (!audioAlarmEnabled) return
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35)

      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start()
      osc.stop(ctx.currentTime + 0.36)
    } catch {
      // Audio context policy
    }
  }, [audioAlarmEnabled])

  // Load cameras and threat alerts
  const loadData = () => {
    fetchCCTVCameras()
      .then((cams) => {
        setCameras(cams)
        if (cams.length > 0 && !selectedCamId) setSelectedCamId(cams[0].id)
      })
      .catch(() => {})

    fetchThreatLogs()
      .then(setIncidentLog)
      .catch(() => {})
  }

  useEffect(() => {
    loadData()
  }, [])

  // Start Device / Mobile Rear Camera
  const startCamera = async (modeSelected: 'environment' | 'user' = facingMode) => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: modeSelected }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      setIsCameraActive(true)
      setFacingMode(modeSelected)
    } catch (err: any) {
      alert('Camera access denied or unsupported: ' + (err.message || err))
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
    setAutoDetect(false)
  }

  const toggleFacingMode = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    startCamera(next)
  }

  // Capture Base64 frame from live video
  const captureFrameBase64 = (): string | null => {
    const video = videoRef.current
    if (!video || !isCameraActive || video.videoWidth === 0) return null

    const canvas = canvasRef.current || document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.82)
  }

  // Analyze Frame API Call
  const processFrame = useCallback(async () => {
    if (loading) return
    const b64 = captureFrameBase64()
    if (!b64) return

    setLoading(true)
    try {
      const res = await analyzeBase64Frame(b64, selectedCamId, confidence, safetyZonePx)
      setAnalysis(res)
      if (res.trigger_alarm) {
        playAlarmSound()
      }
      fetchThreatLogs().then(setIncidentLog).catch(() => {})
    } catch (err) {
      console.error('CCTV frame analysis failed:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedCamId, confidence, safetyZonePx, loading, playAlarmSound, isCameraActive])

  // Continuous Auto-Scan Timer (3s interval)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined
    if (autoDetect && isCameraActive) {
      interval = setInterval(() => {
        processFrame()
      }, 2500)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoDetect, isCameraActive, processFrame])

  // File Upload Inspection
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const res = await analyzeCCTVImage(file, selectedCamId, confidence, safetyZonePx)
      setAnalysis(res)
      if (res.trigger_alarm) {
        playAlarmSound()
      }
      fetchThreatLogs().then(setIncidentLog).catch(() => {})
    } catch (err) {
      alert('Analysis error: ' + err)
    } finally {
      setLoading(false)
    }
  }

  // Handle Add Camera
  const handleCreateCamera = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const cam = await addCCTVCamera(newCam)
      setShowAddCamModal(false)
      loadData()
      setSelectedCamId(cam.id)
      alert(`Camera ${cam.name} registered successfully!`)
    } catch (err) {
      alert('Failed to add camera: ' + err)
    }
  }

  // Handle Delete Camera
  const handleDeleteCam = async (id: string) => {
    if (!confirm(`Remove camera ${id}?`)) return
    try {
      await deleteCCTVCamera(id)
      loadData()
    } catch (err) {
      alert('Error removing camera: ' + err)
    }
  }

  // Handle Resolve Alert
  const handleResolveAlert = async (id: string) => {
    try {
      await resolveAlert(id)
      fetchThreatLogs().then(setIncidentLog)
    } catch (err) {
      alert('Could not resolve alert: ' + err)
    }
  }

  // Simulated Scenario Generator
  const triggerSimulatedScenario = async (type: 'caterpillar' | 'aphid' | 'cattle' | 'birds' | 'trespasser') => {
    setLoading(true)
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 640
      canvas.height = 480
      const ctx = canvas.getContext('2d')!

      // Crop Field Background
      const grad = ctx.createLinearGradient(0, 0, 0, 480)
      grad.addColorStop(0, '#1e293b')
      grad.addColorStop(0.3, '#15803d')
      grad.addColorStop(1, '#052e16')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, 640, 480)

      // Plant foliage circles
      ctx.fillStyle = '#22c55e'
      ctx.beginPath()
      ctx.arc(200, 260, 80, 0, Math.PI * 2)
      ctx.arc(440, 280, 90, 0, Math.PI * 2)
      ctx.fill()

      // Threat overlay
      if (type === 'caterpillar' || type === 'aphid') {
        ctx.fillStyle = '#7f1d1d'
        ctx.beginPath()
        ctx.arc(210, 240, 22, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px sans-serif'
        ctx.fillText(type === 'caterpillar' ? '🐛 CATERPILLAR ON LEAF' : '🦟 APHID COLONY ON CANOPY', 120, 200)
      } else if (type === 'cattle') {
        ctx.fillStyle = '#78350f'
        ctx.fillRect(180, 200, 140, 90)
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px sans-serif'
        ctx.fillText('🐂 STRAY CATTLE IN STRAWBERRY BED', 140, 180)
      } else if (type === 'birds') {
        ctx.fillStyle = '#0f172a'
        ctx.beginPath()
        ctx.arc(420, 220, 16, 0, Math.PI * 2)
        ctx.arc(460, 210, 18, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px sans-serif'
        ctx.fillText('🐦 AVIAN PEST PECKING BERRIES', 340, 180)
      } else if (type === 'trespasser') {
        ctx.fillStyle = '#1e3a8a'
        ctx.fillRect(210, 190, 45, 120)
        ctx.fillStyle = '#ffffff'
        ctx.font = '14px sans-serif'
        ctx.fillText('👤 HUMAN TRESPASSER IN ORCHARD', 140, 170)
      }

      const b64 = canvas.toDataURL('image/jpeg', 0.85)
      const res = await analyzeBase64Frame(b64, selectedCamId, confidence, safetyZonePx)
      setAnalysis(res)
      if (res.trigger_alarm) {
        playAlarmSound()
      }
      fetchThreatLogs().then(setIncidentLog).catch(() => {})
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = incidentLog.filter((inc) => {
    if (logFilter === 'ALL') return true
    return inc.threat_level === logFilter || inc.status === logFilter
  })

  return (
    <div className="space-y-5 pb-20 md:pb-8">
      {/* Top Header & Alarm Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-950 via-agri-950 to-orange-950 text-white p-4 sm:p-6 rounded-3xl shadow-xl border border-orange-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-400/30">
              <Radio size={12} className="animate-pulse text-orange-400" />
              AI Mobile Plant CCTV & Harmful Threat Monitor
            </span>
            <span className="text-xs text-orange-200/70 hidden sm:inline">v2.4 Proximity Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black mt-1 text-white tracking-tight flex items-center gap-2">
            <Video className="text-orange-400" size={24} />
            Plant Protection CCTV System
          </h2>
          <p className="text-xs sm:text-sm text-orange-100/80 mt-0.5">
            Turn your phone camera into a live AI plant monitor. Detect plants, pests, stray animals & pathogens inside virtual safety zones.
          </p>
        </div>

        {/* Action Controls & Navigation Tabs */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setAudioAlarmEnabled((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
              audioAlarmEnabled
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-white/10 text-slate-300 border-white/10 hover:bg-white/15'
            }`}
          >
            {audioAlarmEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            {audioAlarmEnabled ? 'Siren Active' : 'Muted'}
          </button>

          <div className="flex bg-white/10 p-1 rounded-2xl border border-white/15 text-xs">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                activeTab === 'live' ? 'bg-orange-500 text-slate-950 shadow' : 'text-orange-100 hover:text-white'
              }`}
            >
              Live Monitor
            </button>
            <button
              onClick={() => setActiveTab('alerts')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                activeTab === 'alerts' ? 'bg-orange-500 text-slate-950 shadow' : 'text-orange-100 hover:text-white'
              }`}
            >
              Alert Evidence ({incidentLog.length})
            </button>
            <button
              onClick={() => setActiveTab('cameras')}
              className={`px-3 py-1.5 rounded-xl font-bold transition ${
                activeTab === 'cameras' ? 'bg-orange-500 text-slate-950 shadow' : 'text-orange-100 hover:text-white'
              }`}
            >
              Cameras ({cameras.length})
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'live' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Main CCTV Feed (2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-4">
            {/* Camera Source Selector Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMode('simulated')
                    stopCamera()
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    mode === 'simulated' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Layers size={15} /> Farm CCTV Channels
                </button>

                <button
                  onClick={() => {
                    setMode('device')
                    startCamera()
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    mode === 'device' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Camera size={15} /> Live Mobile Phone Camera
                </button>

                <button
                  onClick={() => {
                    setMode('upload')
                    stopCamera()
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    mode === 'upload' ? 'bg-orange-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Upload size={15} /> Inspect Photo
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {mode === 'device' && (
                  <button
                    onClick={toggleFacingMode}
                    className="text-xs text-orange-800 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-xl border border-orange-200 font-bold"
                  >
                    Flip Camera ({facingMode === 'environment' ? 'Back Rear' : 'Front'})
                  </button>
                )}
                <button
                  onClick={() => setShowPairingModal(true)}
                  className="text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl border border-slate-200 font-bold flex items-center gap-1"
                >
                  <QrCode size={13} /> Pair Mobile / IP Cam
                </button>
              </div>
            </div>

            {/* Live Video / Feed Viewport */}
            <div className="relative bg-slate-950 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl aspect-video flex items-center justify-center group">
              {/* Live WebRTC / Browser Camera Element */}
              {mode === 'device' && (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className={`w-full h-full object-cover ${analysis ? 'hidden' : 'block'}`}
                />
              )}

              {/* Annotated Frame Display (with Plants, Threats, Protection Zones & Proximity vectors) */}
              {analysis ? (
                <img
                  src={`data:image/jpeg;base64,${analysis.annotated_frame_base64}`}
                  alt="Annotated CCTV Feed"
                  className="w-full h-full object-contain"
                />
              ) : mode === 'device' && !isCameraActive ? (
                <div className="text-center p-6 text-slate-400 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-emerald-400">
                    <Camera size={32} />
                  </div>
                  <div>
                    <p className="font-bold text-base text-slate-200">Mobile Phone Camera Offline</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Tap below to grant camera access and start live monitoring of your crop foliage.
                    </p>
                  </div>
                  <button
                    onClick={() => startCamera()}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition shadow"
                  >
                    <Play size={14} className="inline mr-1" /> Start Rear Phone Camera
                  </button>
                </div>
              ) : mode === 'upload' ? (
                <div className="text-center p-6 text-slate-400 space-y-3">
                  <Upload size={44} className="mx-auto text-orange-400" />
                  <p className="font-bold text-slate-200 text-sm">Upload Plant Foliage or Field CCTV Snapshot</p>
                  <label className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition cursor-pointer shadow">
                    <Upload size={14} /> Choose File
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              ) : (
                /* Simulated CCTV View */
                <div className="text-center p-6 text-slate-400 space-y-3">
                  <div className="w-16 h-16 rounded-3xl bg-orange-950/80 border border-orange-500/30 flex items-center justify-center mx-auto text-orange-400">
                    <Video size={32} />
                  </div>
                  <div>
                    <div className="font-bold text-slate-200 text-sm">
                      {cameras.find((c) => c.id === selectedCamId)?.name || 'Farm CCTV Feed'}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                      Select a test threat scenario below to simulate AI plant protection zones & harmful pest detection, or switch to Live Mobile Camera.
                    </p>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {/* HUD Overlays */}
              <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/60 flex items-center gap-2 text-xs text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-mono text-orange-300 font-bold">{selectedCamId}</span>
                <span className="text-slate-400">|</span>
                <span className="font-mono text-[11px] text-slate-300">
                  {analysis?.timestamp || new Date().toLocaleTimeString()}
                </span>
              </div>

              {/* Active Threat Alert Badge */}
              {analysis && analysis.risk_level !== 'SAFE' && (
                <div className="absolute top-3 right-3 animate-bounce">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-xl ${
                      analysis.risk_level === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-600'
                    }`}
                  >
                    <AlertTriangle size={14} />
                    {analysis.risk_level} THREAT DETECTED
                  </span>
                </div>
              )}

              {loading && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-orange-400 text-xs font-bold">
                  <RefreshCw size={24} className="animate-spin text-orange-400" />
                  Analyzing Plants & Spatial Protection Zones...
                </div>
              )}
            </div>

            {/* Quick Actions & Camera Controls Bar */}
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {mode === 'device' && isCameraActive && (
                    <>
                      <button
                        onClick={processFrame}
                        disabled={loading}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition shadow"
                      >
                        <Eye size={15} /> Scan Current Frame
                      </button>

                      <button
                        onClick={() => setAutoDetect((v) => !v)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition border ${
                          autoDetect
                            ? 'bg-red-600 text-white border-red-700 animate-pulse'
                            : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {autoDetect ? <Square size={14} /> : <Play size={14} />}
                        {autoDetect ? 'Surveillance Active (Auto)' : 'Start Continuous Auto-Scan'}
                      </button>
                    </>
                  )}

                  {mode === 'simulated' && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-500">Test Scenarios:</span>
                      <button
                        onClick={() => triggerSimulatedScenario('caterpillar')}
                        disabled={loading}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition"
                      >
                        🐛 Caterpillar
                      </button>
                      <button
                        onClick={() => triggerSimulatedScenario('aphid')}
                        disabled={loading}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 transition"
                      >
                        🦟 Aphid Colony
                      </button>
                      <button
                        onClick={() => triggerSimulatedScenario('cattle')}
                        disabled={loading}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition"
                      >
                        🐂 Stray Cattle
                      </button>
                      <button
                        onClick={() => triggerSimulatedScenario('birds')}
                        disabled={loading}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition"
                      >
                        🐦 Avian Pest
                      </button>
                    </div>
                  )}
                </div>

                {/* Protection Zone Buffer & Confidence Sliders */}
                <div className="flex items-center gap-4 text-xs text-slate-600 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <Sliders size={14} className="text-orange-600" />
                    <span>Safety Zone:</span>
                    <input
                      type="range"
                      min="20"
                      max="120"
                      step="10"
                      value={safetyZonePx}
                      onChange={(e) => setSafetyZonePx(parseInt(e.target.value))}
                      className="w-20 accent-orange-600 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-slate-800">{safetyZonePx}px</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span>YOLO Conf:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="0.8"
                      step="0.05"
                      value={confidence}
                      onChange={(e) => setConfidence(parseFloat(e.target.value))}
                      className="w-20 accent-orange-600 cursor-pointer"
                    />
                    <span className="font-mono font-bold text-slate-800">{Math.round(confidence * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Detection Panel, Spatial Proximity & Alert Details */}
          <div className="space-y-4">
            {/* Risk Level & Threat Counter Card */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity size={15} className="text-orange-600" /> Plant Protection Status
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    analysis?.risk_level === 'CRITICAL'
                      ? 'bg-red-100 text-red-700 border border-red-300'
                      : analysis?.risk_level === 'WARNING'
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {analysis?.risk_level === 'CRITICAL'
                    ? '🔴 CRITICAL'
                    : analysis?.risk_level === 'WARNING'
                    ? '🟡 WARNING'
                    : '🟢 SAFE'}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-3xl font-black text-slate-900 tracking-tight">
                    {analysis ? `${analysis.danger_score}%` : '0%'}
                  </div>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Crop Danger Vulnerability</p>
                </div>

                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {analysis && analysis.danger_score > 50 ? (
                    <AlertTriangle size={28} className="text-red-600 animate-pulse" />
                  ) : (
                    <ShieldCheck size={28} className="text-emerald-600" />
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Plants Tracked</div>
                  <div className="font-extrabold text-slate-900 text-base">
                    🌱 {analysis?.plants_count || 0}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Active Threat Objects</div>
                  <div className="font-extrabold text-orange-700 text-base">
                    🚨 {analysis?.threats_count || 0}
                  </div>
                </div>
              </div>

              {/* Multi-frame temporal confirmation indicator */}
              {analysis && (
                <div className="text-[11px] text-slate-500 bg-orange-50 p-2.5 rounded-xl border border-orange-100 flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Multi-Frame Temporal Confirmation:</span>
                  <span className="font-mono font-bold text-orange-800">
                    {analysis.temporal_confirmed ? '✓ Confirmed' : 'Filter Active'} ({analysis.temporal_frames_matched})
                  </span>
                </div>
              )}
            </div>

            {/* Spatial Plant-Threat Proximity Relationships */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={15} className="text-amber-500" /> Plant Protection Proximity Zones
              </h3>

              {analysis && analysis.threats.length > 0 ? (
                <div className="space-y-3">
                  {analysis.threats.map((tItem, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border space-y-2 ${
                        tItem.threat_level === 'CRITICAL'
                          ? 'bg-red-50/80 border-red-200 text-red-950'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              tItem.threat_level === 'CRITICAL' ? 'bg-red-600' : 'bg-amber-500'
                            }`}
                          />
                          {tItem.threat_label} near {tItem.plant_id}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white font-bold border">
                          {Math.round(tItem.confidence * 100)}% Conf
                        </span>
                      </div>

                      <div className="text-xs space-y-1">
                        <div>
                          <strong>Target Plant:</strong> {tItem.plant_id} ({tItem.plant_class})
                        </div>
                        <div>
                          <strong>Proximity Distance:</strong> {tItem.proximity_level} ({tItem.distance_px}px)
                        </div>
                        <div>
                          <strong>Harm:</strong> {tItem.harm}
                        </div>
                      </div>

                      <div className="text-xs bg-white/90 p-2 rounded-xl border border-slate-200 font-semibold text-slate-800">
                        🛡️ <strong>Mitigation Action:</strong> {tItem.action}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs space-y-1">
                  <ShieldCheck size={32} className="mx-auto text-emerald-500 mb-1" />
                  <p className="font-bold text-slate-700">Plant Protection Zone Clear</p>
                  <p className="text-[11px] text-slate-400">No harmful insects, herbivores, or pests inside plant safety buffer.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === 'alerts' ? (
        /* Alert Evidence & History Gallery Tab */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <History size={18} className="text-orange-600" />
                Alert Snapshots & Evidence Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved annotated camera snapshots, detected threat instances, and resolution history
              </p>
            </div>

            <div className="flex items-center gap-2">
              {['ALL', 'CRITICAL', 'HIGH', 'Active Alert', 'Resolved'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    logFilter === filter
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLogs.map((inc) => (
              <div
                key={inc.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  {/* Image Snapshot Preview */}
                  {inc.snapshot ? (
                    <div
                      onClick={() => setSelectedSnapshot(inc)}
                      className="relative rounded-xl overflow-hidden aspect-video bg-slate-950 border border-slate-200 cursor-pointer group"
                    >
                      <img
                        src={`data:image/jpeg;base64,${inc.snapshot}`}
                        alt="Alert Snapshot"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <span className="absolute bottom-2 right-2 bg-slate-950/80 text-white text-[10px] px-2 py-0.5 rounded font-mono">
                        View Evidence
                      </span>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-slate-200 aspect-video flex items-center justify-center text-slate-400 text-xs font-semibold">
                      Snapshot Logged
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                        {inc.id}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 mt-1">{inc.threat_type}</h4>
                      <p className="text-xs text-slate-500 font-medium">{inc.plant_id || inc.camera_id}</p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        inc.threat_level === 'CRITICAL'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {inc.threat_level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{inc.harm_description}</p>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400 font-mono">{inc.timestamp}</span>
                  {inc.status === 'Active Alert' ? (
                    <button
                      onClick={() => handleResolveAlert(inc.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition"
                    >
                      Resolve Alert
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> {inc.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Camera Management Tab */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">Registered CCTV & Mobile Cameras</h3>
              <p className="text-xs text-slate-500 mt-0.5">Manage farm monitoring channels and live stream pairings</p>
            </div>
            <button
              onClick={() => setShowAddCamModal(true)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
            >
              <Plus size={15} /> Add New Camera
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cameras.map((cam) => (
              <div
                key={cam.id}
                className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded border border-orange-200">
                      {cam.id}
                    </span>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] rounded-full">
                      {cam.status}
                    </span>
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900 mt-2">{cam.name}</h4>
                  <p className="text-xs text-slate-500 font-medium">{cam.location}</p>

                  <div className="mt-3 space-y-1 text-xs text-slate-600">
                    <div>
                      Coverage: <strong>{cam.coverage}</strong>
                    </div>
                    <div>
                      Paired Crop: <strong>{cam.paired_crop || 'Farm Crop'}</strong>
                    </div>
                    <div>
                      Resolution: <strong className="font-mono">{cam.resolution}</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedCamId(cam.id)
                      setActiveTab('live')
                    }}
                    className="text-xs text-orange-700 font-bold hover:underline"
                  >
                    View Stream →
                  </button>
                  {cam.default_source !== 'simulated' && (
                    <button
                      onClick={() => handleDeleteCam(cam.id)}
                      className="text-red-600 hover:text-red-700 p-1"
                      title="Remove Camera"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snapshot Preview Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-5 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600" />
                Alert Evidence Snapshot — {selectedSnapshot.id}
              </h3>
              <button onClick={() => setSelectedSnapshot(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {selectedSnapshot.snapshot && (
              <img
                src={`data:image/jpeg;base64,${selectedSnapshot.snapshot}`}
                alt="Full Snapshot"
                className="w-full rounded-2xl max-h-[380px] object-contain bg-slate-950"
              />
            )}

            <div className="text-xs space-y-1.5 text-slate-700 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div>
                <strong>Threat:</strong> {selectedSnapshot.threat_type} ({selectedSnapshot.threat_level})
              </div>
              <div>
                <strong>Target Plant:</strong> {selectedSnapshot.plant_id}
              </div>
              <div>
                <strong>Impact Details:</strong> {selectedSnapshot.harm_description}
              </div>
              <div>
                <strong>Mitigation Taken:</strong> {selectedSnapshot.action_taken}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Camera Modal */}
      {showAddCamModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-slate-900">Register New Farm Camera</h3>
              <button onClick={() => setShowAddCamModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCamera} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Camera Name</label>
                <input
                  type="text"
                  required
                  value={newCam.name}
                  onChange={(e) => setNewCam({ ...newCam, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Location / Field Area</label>
                <input
                  type="text"
                  required
                  value={newCam.location}
                  onChange={(e) => setNewCam({ ...newCam, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Paired Crop</label>
                  <input
                    type="text"
                    value={newCam.paired_crop}
                    onChange={(e) => setNewCam({ ...newCam, paired_crop: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stream Resolution</label>
                  <select
                    value={newCam.resolution}
                    onChange={(e) => setNewCam({ ...newCam, resolution: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                  >
                    <option value="1080p FHD">1080p FHD</option>
                    <option value="4K Ultra">4K Ultra</option>
                    <option value="720p HD">720p HD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Coverage Details</label>
                <input
                  type="text"
                  value={newCam.coverage}
                  onChange={(e) => setNewCam({ ...newCam, coverage: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCamModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold shadow"
                >
                  Save Camera
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code / Mobile Pairing Modal */}
      {showPairingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-sm text-slate-900">Pair Mobile Phone Camera</h3>
              <button onClick={() => setShowPairingModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 text-white rounded-2xl flex flex-col items-center gap-2">
              <QrCode size={110} className="text-orange-400" />
              <div className="text-xs font-mono font-bold text-orange-200">PAIR CODE: AGRI-CCTV-9923</div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Scan this QR code with your smartphone camera to pair your mobile phone as a live field CCTV camera stream.
            </p>

            <button
              onClick={() => {
                setShowPairingModal(false)
                setMode('device')
                startCamera()
              }}
              className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs shadow"
            >
              Open Camera Directly On This Device
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

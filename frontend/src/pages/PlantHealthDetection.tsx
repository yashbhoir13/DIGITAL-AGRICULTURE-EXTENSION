import { useState, useRef, useEffect } from 'react'
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  Upload,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  Sprout,
  History,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
} from 'lucide-react'
import {
  predictPlantHealth,
  getPlantHealthHistory,
  PlantHealthPrediction,
  PlantHealthScanItem,
} from '../services/plantHealthService'

export default function PlantHealthDetection() {
  // Camera state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  
  // Image capture & file state
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  
  // Analysis & result state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [prediction, setPrediction] = useState<PlantHealthPrediction | null>(null)
  
  // Scan history state
  const [history, setHistory] = useState<PlantHealthScanItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Load scan history on mount
  useEffect(() => {
    loadHistory()
    return () => {
      stopCamera()
    }
  }, [])

  const loadHistory = async () => {
    try {
      setLoadingHistory(true)
      const scans = await getPlantHealthHistory()
      setHistory(scans)
    } catch (err) {
      console.warn('Could not load plant scan history:', err)
    } finally {
      setLoadingHistory(false)
    }
  }

  // Camera Management
  const startCamera = async (mode: 'environment' | 'user' = facingMode) => {
    setCameraError(null)
    setPrediction(null)
    setAnalysisError(null)
    
    // Stop any existing stream before starting a new one
    stopCamera()

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      if (!window.isSecureContext && !isLocalhost) {
        setCameraError(
          `Live Camera access is blocked by mobile browsers over unencrypted HTTP (http://${window.location.hostname}). To enable live camera, open via HTTPS or tap 'Take Photo / Upload' below.`
        )
      } else {
        setCameraError(
          'Live camera API is not supported on this browser. You can still use "Take Photo / Upload" to snap or pick a picture.'
        )
      }
      return
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      setIsCameraActive(true)
      setFacingMode(mode)
      setCapturedBlob(null)
      setPreviewUrl(null)
    } catch (err: any) {
      console.error('Camera access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera found on your device. You can upload a photo instead.')
      } else {
        setCameraError(`Unable to start camera: ${err.message || 'Unknown error'}`)
      }
      setIsCameraActive(false)
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
  }

  const switchCamera = () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment'
    startCamera(newMode)
  }

  // Capture image frame from live video
  const capturePlantImage = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (!blob) return
        setCapturedBlob(blob)
        setPreviewUrl(URL.createObjectURL(blob))
        stopCamera()
      },
      'image/jpeg',
      0.92
    )
  }

  // Handle local file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAnalysisError('Invalid file type. Please upload a JPG, PNG, or WebP image.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setAnalysisError('File exceeds 10 MB limit. Please select a smaller photo.')
      return
    }

    stopCamera()
    setCameraError(null)
    setAnalysisError(null)
    setPrediction(null)
    setCapturedBlob(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  // Send captured/uploaded image to backend ML prediction endpoint
  const analyzePlant = async () => {
    if (!capturedBlob) return

    setIsAnalyzing(true)
    setAnalysisError(null)

    try {
      const res = await predictPlantHealth(capturedBlob)
      setPrediction(res)
      // Refresh scan history
      loadHistory()
    } catch (err: any) {
      console.error('Plant health prediction error:', err)
      const detail = err.response?.data?.detail || err.message || 'Failed to analyze plant.'
      setAnalysisError(detail)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // Reset to scan another plant
  const resetScanner = () => {
    setCapturedBlob(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    setPrediction(null)
    setAnalysisError(null)
    setCameraError(null)
    startCamera('environment')
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-agri-950 to-emerald-900 text-white p-5 sm:p-7 rounded-3xl shadow-xl border border-emerald-500/20">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-400" />
            AI Plant Pathology Scanner
          </span>
          {prediction?.mode === 'mock' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              Dev Mode
            </span>
          )}
        </div>
        <h2 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight flex items-center gap-2.5">
          <Sprout size={28} className="text-emerald-400" />
          Healthy Plant & Disease Detection
        </h2>
        <p className="text-xs sm:text-sm text-emerald-100/80 mt-1 max-w-2xl">
          Point your phone camera at crop foliage or leaves to check plant health, identify crop diseases, and receive targeted agronomic advice.
        </p>
      </div>

      {/* Hidden File Input with native mobile camera support */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        capture="environment"
        className="hidden"
      />

      {/* Main Scanner Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-4 sm:p-6 space-y-4">
        {/* Camera Permission / Error Alert */}
        {cameraError && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Camera Notice</p>
              <p>{cameraError}</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition"
              >
                <Upload size={13} />
                Upload Image Instead
              </button>
            </div>
          </div>
        )}

        {/* Analysis Error Alert */}
        {analysisError && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs sm:text-sm flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-red-600 shrink-0" />
            <span>{analysisError}</span>
          </div>
        )}

        {/* 1. Live Camera Viewport */}
        {isCameraActive && !previewUrl && (
          <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 aspect-[4/3] sm:aspect-[16/9] flex items-center justify-center shadow-inner border border-slate-800">
            <video
              ref={videoRef}
              playsInline
              autoPlay
              muted
              className="w-full h-full object-cover"
            />

            {/* Target Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
              {/* Corner targeting frame */}
              <div className="relative w-64 h-64 max-w-[80%] max-h-[80%] border-2 border-dashed border-emerald-400/70 rounded-2xl flex items-center justify-center shadow-2xl">
                <div className="w-8 h-8 absolute -top-1 -left-1 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
                <div className="w-8 h-8 absolute -top-1 -right-1 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
                <div className="w-8 h-8 absolute -bottom-1 -left-1 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
                <div className="w-8 h-8 absolute -bottom-1 -right-1 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
                <div className="w-full h-0.5 bg-emerald-400/40 animate-pulse" />
              </div>
              <span className="mt-4 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md text-[11px] font-semibold text-emerald-200 border border-white/10">
                Position the plant / leaf inside the frame
              </span>
            </div>

            {/* Live Camera Controls */}
            <div className="absolute bottom-4 inset-x-0 flex items-center justify-center gap-4 px-4">
              <button
                onClick={switchCamera}
                title="Switch Camera"
                className="w-11 h-11 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white backdrop-blur flex items-center justify-center border border-white/20 shadow-lg transition active:scale-95"
              >
                <FlipHorizontal size={18} />
              </button>

              <button
                onClick={capturePlantImage}
                className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-sm rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition"
              >
                <Camera size={18} />
                Capture Plant
              </button>

              <button
                onClick={stopCamera}
                title="Stop Camera"
                className="w-11 h-11 rounded-full bg-red-600/80 hover:bg-red-700 text-white backdrop-blur flex items-center justify-center border border-white/20 shadow-lg transition active:scale-95"
              >
                <CameraOff size={18} />
              </button>
            </div>
          </div>
        )}

        {/* 2. Image Preview (Captured from Camera or Uploaded from disk) */}
        {previewUrl && (
          <div className="space-y-4">
            <div className="relative w-full rounded-2xl overflow-hidden bg-slate-950 max-h-[420px] flex items-center justify-center border border-slate-200">
              <img
                src={previewUrl}
                alt="Captured plant preview"
                className="max-h-[400px] w-auto object-contain rounded-xl"
              />
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center gap-3 text-white">
                  <div className="relative w-12 h-12">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
                  </div>
                  <div className="text-sm font-bold text-emerald-300 animate-pulse">
                    🔍 Analyzing plant foliage...
                  </div>
                  <div className="text-xs text-slate-400">Extracting crop features & health status</div>
                </div>
              )}
            </div>

            {/* Action Buttons for Preview */}
            {!prediction && (
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={analyzePlant}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto flex-1 py-3 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Analyze Plant
                    </>
                  )}
                </button>

                <button
                  onClick={resetScanner}
                  disabled={isAnalyzing}
                  className="w-full sm:w-auto py-3 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition flex items-center justify-center gap-2 border border-slate-200"
                >
                  <RefreshCw size={15} />
                  Retake Photo
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Idle Camera State */}
        {!isCameraActive && !previewUrl && (
          <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
              <Camera size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-800 text-base sm:text-lg">
                Start Phone Camera or Upload Photo
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                Scan your crop leaves in natural daylight for instant pathology analysis and treatment suggestions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => startCamera('environment')}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
              >
                <Camera size={18} />
                Start Camera
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 active:scale-95 text-slate-700 font-bold text-sm border border-slate-200 shadow-xs transition flex items-center justify-center gap-2"
              >
                <Upload size={18} />
                Upload Image Instead
              </button>
            </div>
          </div>
        )}

        {/* 4. AI Diagnosis Result Card */}
        {prediction && (
          <div className="mt-6 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 shadow-md p-5 sm:p-7 space-y-5">
            {/* Result Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    prediction.status === 'Healthy'
                      ? 'bg-emerald-100 text-emerald-700'
                      : prediction.status === 'Diseased'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {prediction.status === 'Healthy' ? (
                    <CheckCircle2 size={26} />
                  ) : prediction.status === 'Diseased' ? (
                    <AlertTriangle size={26} />
                  ) : (
                    <HelpCircle size={26} />
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-slate-400">
                    AI Diagnosis Result
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
                    {prediction.plant}
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-black uppercase ${
                        prediction.status === 'Healthy'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : prediction.status === 'Diseased'
                          ? 'bg-red-100 text-red-800 border border-red-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {prediction.status === 'Healthy'
                        ? '✓ Healthy'
                        : prediction.status === 'Diseased'
                        ? '⚠ Diseased'
                        : '? Unknown / Unclear'}
                    </span>
                  </h3>
                </div>
              </div>

              {/* Confidence Metric */}
              <div className="bg-slate-100 px-4 py-2 rounded-2xl text-right sm:self-center">
                <span className="text-[11px] uppercase font-bold text-slate-500">Confidence</span>
                <div className="text-xl font-black text-slate-900">{prediction.confidence}%</div>
              </div>
            </div>

            {/* Confidence Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span>Model Certainty</span>
                <span>{prediction.confidence}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    prediction.confidence >= 85
                      ? 'bg-emerald-500'
                      : prediction.confidence >= 65
                      ? 'bg-amber-500'
                      : 'bg-slate-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, prediction.confidence))}%` }}
                />
              </div>
            </div>

            {/* Disease Details (if applicable) */}
            {prediction.disease && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                  Identified Disease
                </span>
                <div className="text-lg font-black text-amber-900">{prediction.disease}</div>
              </div>
            )}

            {/* Agronomic Recommendation */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Info size={14} className="text-emerald-600" />
                Agronomic Recommendation & Next Steps
              </span>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                {prediction.recommendation}
              </p>
            </div>

            {/* Mock / Dev Mode Banner */}
            {prediction.mode === 'mock' && (
              <div className="p-3 rounded-xl bg-amber-100/60 border border-amber-300 text-amber-900 text-xs flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-700" />
                  Development Mode — model not connected
                </span>
                <span className="text-[11px] text-amber-700">OpenCV Heuristic Inference</span>
              </div>
            )}

            {/* Disclaimer */}
            <p className="text-[11px] text-slate-400 leading-tight">
              * AI predictions are advisory and intended for rapid field decision support. Always confirm severe crop symptoms with a certified agricultural extension officer.
            </p>

            {/* Reset / Scan Next Button */}
            <button
              onClick={resetScanner}
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Camera size={18} />
              Scan Another Plant
            </button>
          </div>
        )}
      </div>

      {/* 5. Recent Scan History Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-slate-900 text-base sm:text-lg flex items-center gap-2">
            <History size={18} className="text-emerald-600" />
            Recent Plant Scans
          </h3>
          <button
            onClick={loadHistory}
            disabled={loadingHistory}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition flex items-center gap-1"
          >
            <RefreshCw size={12} className={loadingHistory ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center italic">
            No plant scans recorded yet. Use the camera above to scan your first plant!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="p-3">Plant</th>
                  <th className="p-3">Health Status</th>
                  <th className="p-3">Disease</th>
                  <th className="p-3">Confidence</th>
                  <th className="p-3">Scanned Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((scan) => (
                  <tr key={scan.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">{scan.plant_name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          scan.status === 'Healthy'
                            ? 'bg-emerald-100 text-emerald-800'
                            : scan.status === 'Diseased'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {scan.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{scan.disease || '—'}</td>
                    <td className="p-3 font-mono font-bold text-slate-800">{scan.confidence}%</td>
                    <td className="p-3 text-slate-400 font-mono">
                      {scan.created_at ? new Date(scan.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

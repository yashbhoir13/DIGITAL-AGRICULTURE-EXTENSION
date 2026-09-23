import { useState } from 'react'
import api from '../services/api'
import { ErrorBox, PageHeader } from '../components/ui'

export default function StrawberryDetection() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function run() {
    if (!file) {
      setError('Choose an image first')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const body = new FormData()
      body.append('file', file)
      const { data } = await api.post('/vision/strawberry/detect', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Detection failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Strawberry Detection (CV Module)"
        subtitle="Computer vision AI module — YOLO object detection & automated yield estimation"
      />
      <ErrorBox message={error} />
      <div className="card space-y-3 mb-4">
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button disabled={busy} onClick={run} className="rounded-xl bg-agri-600 text-white px-4 py-2 disabled:opacity-60">
          {busy ? 'Detecting…' : 'Detect strawberries'}
        </button>
        <p className="text-xs text-slate-500">
          Pipeline: images → annotation → YOLO train → weights in vision/weights/best.pt → inference. Accuracy metrics are only shown when calculated from real evaluation — never fabricated.
        </p>
      </div>
      {result && (
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="card">
            <div className="font-semibold">Engine: {result.engine}</div>
            <div className="text-3xl font-bold mt-2">{result.count} detected</div>
            <ul className="mt-3 text-sm space-y-1">
              {result.detections.map((d: any, i: number) => (
                <li key={i}>{d.label}: {d.confidence.toFixed(2)} · bbox [{d.bbox.map((v: number) => v.toFixed(0)).join(', ')}]</li>
              ))}
            </ul>
            <p className="text-xs text-amber-700 mt-3">{result.notes}</p>
          </div>
          {result.annotated_image_base64 && (
            <div className="card">
              <img alt="Annotated" className="rounded-xl w-full" src={`data:image/jpeg;base64,${result.annotated_image_base64}`} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

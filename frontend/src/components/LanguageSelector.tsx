import { Globe } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { Language } from '../i18n/translations'

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'हिंदी', flag: '🇮🇳' },
    { code: 'mr', label: 'मराठी', flag: '🚩' },
  ]

  return (
    <div className="flex items-center bg-slate-100/90 hover:bg-slate-200/80 p-0.5 rounded-xl border border-slate-200 text-xs">
      <Globe size={13} className="text-slate-500 ml-1.5 mr-1" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 cursor-pointer pr-1 py-1 outline-hidden"
        aria-label="Select App Language"
      >
        {languages.map((l) => (
          <option key={l.code} value={l.code}>
            {l.flag} {l.label}
          </option>
        ))}
      </select>
    </div>
  )
}

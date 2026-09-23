import { useState, useEffect } from 'react'
import {
  Store,
  Plus,
  Phone,
  MessageCircle,
  MapPin,
  Calendar,
  Award,
  Filter,
  CheckCircle,
  X,
  Send,
  Sparkles,
} from 'lucide-react'
import {
  fetchHarvestListings,
  postHarvestListing,
  HarvestListing,
  NewListingInput,
} from '../services/marketplaceService'
import { useLanguage } from '../context/LanguageContext'

export default function Marketplace() {
  const { t } = useLanguage()
  const [listings, setListings] = useState<HarvestListing[]>([])
  const [selectedCrop, setSelectedCrop] = useState<string>('ALL')
  const [showModal, setShowModal] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [posting, setPosting] = useState<boolean>(false)

  // New lot form state
  const [formData, setFormData] = useState<NewListingInput>({
    crop: 'Strawberry',
    variety: 'Winter Dawn Premium',
    quantity_quintals: 25,
    price_per_kg: 220,
    harvest_date: new Date(Date.now() + 86400000 * 7).toISOString().slice(0, 10),
    farm_name: 'Mahabaleshwar Agro Farm',
    location: 'Mahabaleshwar, Satara, Maharashtra',
    phone: '+91 99233 45931',
    whatsapp: '919923345931',
    organic_certified: true,
    grade: 'Grade A Export',
    notes: 'Cold storage pre-cooled, ready for dispatch to terminal markets.',
  })

  const loadListings = () => {
    setLoading(true)
    fetchHarvestListings()
      .then(setListings)
      .catch((err) => console.error(err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadListings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPosting(true)
    try {
      await postHarvestListing(formData)
      setShowModal(false)
      loadListings()
      alert('Your harvest batch has been published to the buyer network!')
    } catch (err) {
      alert('Failed to post listing: ' + err)
    } finally {
      setPosting(false)
    }
  }

  const crops = ['ALL', ...Array.from(new Set(listings.map((l) => l.crop)))]

  const filtered = listings.filter((l) => {
    if (selectedCrop === 'ALL') return true
    return l.crop === selectedCrop
  })

  return (
    <div className="space-y-5 pb-16 md:pb-6">
      {/* Top Header */}
      <div className="bg-gradient-to-r from-agri-950 via-agri-900 to-orange-950 text-white p-4 sm:p-6 rounded-3xl shadow-lg border border-orange-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-300 border border-orange-400/30">
            Direct Farmer-to-Buyer Exchange
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-1 text-white tracking-tight flex items-center gap-2">
            <Store size={24} className="text-orange-400" />
            {t.marketplace}
          </h2>
          <p className="text-xs sm:text-sm text-orange-100/80 mt-0.5">
            Connect directly with wholesale buyers, retailers, and FPOs without middleman brokerage.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition shadow-md shrink-0 self-start sm:self-auto"
        >
          <Plus size={16} /> {t.postHarvest}
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {crops.map((c) => (
          <button
            key={c}
            onClick={() => setSelectedCrop(c)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
              selectedCrop === c
                ? 'bg-orange-600 text-white border-orange-500 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {c === 'ALL' ? t.allCrops : c}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((lot) => {
          const rawWa = lot.whatsapp ? lot.whatsapp.replace(/\D/g, '') : '919923345931'
          const formattedWa = rawWa.length === 10 ? `91${rawWa}` : rawWa || '919923345931'
          const waMessage = encodeURIComponent(
            `Namaskar ${lot.farmer_name}, I saw your listing for ${lot.quantity_quintals} Quintals of ${lot.crop} (${lot.variety}) on AgriSmart at Rs ${lot.price_per_kg}/kg. I am interested in purchasing. Please share dispatch details.`
          )
          const waUrl = `https://wa.me/${formattedWa}?text=${waMessage}`

          return (
            <div
              key={lot.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Badge and Crop header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-orange-700 bg-orange-50 px-2 py-0.5 rounded-md border border-orange-200">
                      {lot.id}
                    </span>
                    <h3 className="text-lg font-black text-slate-900 mt-1">{lot.crop}</h3>
                    <p className="text-xs font-semibold text-slate-500">{lot.variety}</p>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-black text-orange-700">₹{lot.price_per_kg}</div>
                    <div className="text-[10px] text-slate-400 font-medium">per kg wholesale</div>
                  </div>
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{t.quantity}</div>
                    <div className="font-extrabold text-slate-800 text-sm">
                      {lot.quantity_quintals} Quintals
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{t.harvestDate}</div>
                    <div className="font-semibold text-slate-700 text-xs flex items-center gap-1 mt-0.5">
                      <Calendar size={12} className="text-orange-600" />
                      {lot.harvest_date}
                    </div>
                  </div>
                </div>

                {/* Location & Farmer info */}
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800">
                    <MapPin size={13} className="text-orange-600 shrink-0" />
                    <span>{lot.location}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Farm: <strong>{lot.farm_name}</strong> ({lot.farmer_name})
                  </div>
                  {lot.organic_certified && (
                    <div className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-800 bg-orange-100/70 px-2 py-0.5 rounded-md">
                      <Award size={11} /> Organic / APEDA Certified
                    </div>
                  )}
                </div>

                {lot.notes && (
                  <p className="text-[11px] text-slate-500 italic border-t border-slate-100 pt-2">
                    "{lot.notes}"
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-sm"
                >
                  <MessageCircle size={15} /> {t.contactFarmer}
                </a>

                <a
                  href={`tel:${lot.phone}`}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold p-2 rounded-xl transition"
                  title="Direct Call"
                >
                  <Phone size={15} />
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Post Harvest Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-orange-600" />
                List Your Harvest Lot for Buyers
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Commodity / Crop</label>
                  <select
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  >
                    <option value="Strawberry">Strawberry</option>
                    <option value="Tomato">Tomato</option>
                    <option value="Onion">Onion</option>
                    <option value="Grapes">Grapes</option>
                    <option value="Wheat">Wheat</option>
                    <option value="Soybean">Soybean</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Variety / Grade</label>
                  <input
                    type="text"
                    required
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                    placeholder="e.g. Winter Dawn Grade A"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Quantity (Quintals)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.quantity_quintals}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity_quintals: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Price (₹/kg)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.price_per_kg}
                    onChange={(e) =>
                      setFormData({ ...formData, price_per_kg: parseFloat(e.target.value) })
                    }
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Expected Harvest Date</label>
                  <input
                    type="date"
                    required
                    value={formData.harvest_date}
                    onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Farm / Nursery Name</label>
                  <input
                    type="text"
                    required
                    value={formData.farm_name}
                    onChange={(e) => setFormData({ ...formData, farm_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Farm Location & District</label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Special Packaging / Notes</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-medium text-slate-800"
                  placeholder="e.g. Packaged in 250g punnets, pre-cooled at 4°C"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow"
                >
                  <Send size={14} /> {posting ? 'Publishing...' : 'Publish Lot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

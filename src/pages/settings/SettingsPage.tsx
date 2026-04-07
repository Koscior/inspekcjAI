import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-4">
        <Settings size={24} className="text-gray-400" />
        <h1 className="text-xl font-bold text-gray-900">Ustawienia</h1>
      </div>
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <Settings size={40} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">Ustawienia będą dostępne wkrótce.</p>
      </div>
    </div>
  )
}

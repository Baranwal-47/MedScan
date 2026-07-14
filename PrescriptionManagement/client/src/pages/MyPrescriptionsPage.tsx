import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { api } from '@/lib/apiBase';
import { FileText, Camera, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react';

interface PrescriptionListItem {
  _id: string;
  imageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  ocrEngine: string;
  createdAt: string;
  matchedMedicines: { medicine: { _id: string; name: string; price?: string } | null; query: string }[];
  unmatchedNames: string[];
}

const statusBadge = {
  pending: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, label: 'Pending review' },
  approved: { cls: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, label: 'Approved' },
  rejected: { cls: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Rejected' },
};

const engineLabel: Record<string, string> = {
  gemini: 'AI Vision',
  trocr: 'TrOCR',
  ocrspace: 'OCR',
  client: 'On-device OCR',
  none: 'Manual',
};

export default function MyPrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/prescriptions')
      .then((res) => setPrescriptions(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Prescriptions</h1>
        <p className="text-gray-600 mb-8">Every prescription you've scanned, with its review status.</p>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No prescriptions yet</h2>
            <p className="text-gray-600 mb-6">Scan a prescription and we'll match its medicines against our store.</p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              <Camera className="w-4 h-4" />
              Scan a prescription
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((p) => {
              const badge = statusBadge[p.status] ?? statusBadge.pending;
              const BadgeIcon = badge.icon;
              const matchedNames = p.matchedMedicines
                .map((m) => m.medicine?.name)
                .filter(Boolean) as string[];
              return (
                <Link
                  key={p._id}
                  href={`/prescriptions/${p._id}`}
                  className="flex items-center gap-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow p-4"
                >
                  <img
                    src={p.imageUrl}
                    alt="Prescription"
                    className="w-20 h-20 object-cover rounded-lg bg-gray-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${badge.cls}`}>
                        <BadgeIcon className="w-3 h-3" />
                        {badge.label}
                      </span>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {engineLabel[p.ocrEngine] ?? p.ocrEngine}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900 font-medium truncate">
                      {matchedNames.length > 0
                        ? matchedNames.slice(0, 3).join(', ') + (matchedNames.length > 3 ? ` +${matchedNames.length - 3} more` : '')
                        : 'No medicines matched'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {matchedNames.length} matched · {p.unmatchedNames.length} not in catalogue
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

type TimeLog = {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
}

type Props = {
  activeLog: TimeLog | null
  saving: boolean
  onClockIn: () => void
  onClockOut: () => void
}

export default function TimerCard({
  activeLog,
  saving,
  onClockIn,
  onClockOut,
}: Props) {
  return (
    <div className="w-full mb-4">
      {activeLog && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3 mb-4 text-center">
          <p className="text-sm font-medium text-green-700">
            ● Session active
          </p>
        </div>
      )}

      {activeLog ? (
        <button
          onClick={onClockOut}
          disabled={saving}
          className="w-full bg-green-600 py-5 rounded-2xl text-lg font-semibold text-white shadow-lg active:scale-95 transition"
        >
          {saving ? 'Saving...' : 'Clock Out'}
        </button>
      ) : (
        <button
          onClick={onClockIn}
          disabled={saving}
          className="w-full bg-gradient-to-r from-green-600 to-green-500 py-5 rounded-2xl text-lg font-semibold text-white shadow-lg active:scale-95 transition"
        >
          {saving ? 'Saving...' : 'Clock In'}
        </button>
      )}
    </div>
  )
}
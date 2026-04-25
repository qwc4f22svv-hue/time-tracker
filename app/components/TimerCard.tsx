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
    <div className="mt-4">
      {activeLog && (
        <p className="text-center text-sm font-medium text-neutral-700 mb-3">
          ● Session active
        </p>
      )}

      <div className="fixed bottom-4 left-0 right-0 px-5 max-w-md mx-auto">
        {activeLog ? (
          <button
            onClick={onClockOut}
            disabled={saving}
            className="w-full bg-red-600 py-5 rounded-2xl text-lg font-semibold text-white shadow-xl active:scale-95 transition"
          >
            {saving ? 'Saving...' : 'Clock Out'}
          </button>
        ) : (
          <button
            onClick={onClockIn}
            disabled={saving}
            className="w-full bg-gradient-to-r from-green-600 to-green-500 py-5 rounded-2xl text-lg font-semibold text-white shadow-xl active:scale-95 transition"
          >
            {saving ? 'Saving...' : 'Clock In'}
          </button>
        )}
      </div>
    </div>
  )
}
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
    <>
      <div className="bg-neutral-900 p-4 rounded-xl mb-24">
        {activeLog ? (
          <p className="text-center text-sm text-gray-400">
            Session active
          </p>
        ) : (
          <p className="text-center text-sm text-gray-400">
            Not clocked in
          </p>
        )}
      </div>

      <div className="fixed bottom-4 left-0 right-0 px-4 max-w-md mx-auto">
        {activeLog ? (
          <button
            onClick={onClockOut}
            disabled={saving}
            className="w-full bg-red-600 py-4 rounded-2xl font-semibold text-white shadow-lg active:scale-95 transition"
          >
            {saving ? 'Saving...' : 'Clock Out'}
          </button>
        ) : (
          <button
            onClick={onClockIn}
            disabled={saving}
            className="w-full bg-green-600 py-4 rounded-2xl font-semibold text-white shadow-lg active:scale-95 transition"
          >
            {saving ? 'Saving...' : 'Clock In'}
          </button>
        )}
      </div>
    </>
  )
}
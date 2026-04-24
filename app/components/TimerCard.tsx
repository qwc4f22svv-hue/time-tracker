type TimeLog = {
  id: string
  user_id: string
  clock_in: string
  clock_out: string | null
}

type Props = {
  activeLog: TimeLog | null
  elapsed: number
  saving: boolean
  onClockIn: () => void
  onClockOut: () => void
}

export default function TimerCard({
  activeLog,
  elapsed,
  saving,
  onClockIn,
  onClockOut,
}: Props) {
  return (
    <div className="bg-neutral-900 p-4 rounded-xl mb-6">
      {activeLog ? (
        <>
          <p className="text-3xl font-semibold mb-4 text-center">
            {Math.floor(elapsed / 60)}m {elapsed % 60}s
          </p>

          <button
            onClick={onClockOut}
            disabled={saving}
            className="w-full bg-red-600 py-3 rounded-lg font-semibold"
          >
            {saving ? 'Saving...' : 'Clock Out'}
          </button>
        </>
      ) : (
        <button
          onClick={onClockIn}
          disabled={saving}
          className="w-full bg-green-600 py-3 rounded-lg font-semibold"
        >
          {saving ? 'Saving...' : 'Clock In'}
        </button>
      )}
    </div>
  )
}
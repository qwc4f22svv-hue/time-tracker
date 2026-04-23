import { TimeLog } from '../type/time'

type Props = {
  groupedLogs: Record<string, TimeLog[]>
  getDuration: (log: TimeLog) => number
  formatDuration: (ms: number) => string
}

export default function HistoryList({
  groupedLogs,
  getDuration,
  formatDuration,
}: Props) {
  if (Object.keys(groupedLogs).length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-6">
        No time logged yet
      </div>
    )
  }

  return (
    <>
      {Object.entries(groupedLogs).map(([date, dayLogs]) => {
        const total = dayLogs.reduce(
          (sum, log) => sum + getDuration(log),
          0
        )

        return (
          <div key={date} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">
              {date}
            </h3>

            {dayLogs.map((log) => {
              const isActive = !log.clock_out

              return (
                <div
                  key={log.id}
                  className={`border p-3 rounded mb-2 text-sm ${
                    isActive ? 'bg-green-50 border-green-400' : ''
                  }`}
                >
                  {isActive && (
                    <div className="text-green-600 text-xs font-semibold mb-1">
                      ● LIVE
                    </div>
                  )}

                  <div>
                    In: {new Date(log.clock_in).toLocaleTimeString()}
                  </div>

                  <div>
                    Out:{' '}
                    {log.clock_out
                      ? new Date(log.clock_out).toLocaleTimeString()
                      : 'Active'}
                  </div>
                </div>
              )
            })}

            <div className="text-right font-semibold text-sm">
              Total: {formatDuration(total)}
            </div>
          </div>
        )
      })}
    </>
  )
}
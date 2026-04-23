import { TimeLog } from '../type/time'

type Props = {
  weekData: { day: string; total: number }[]
  formatDuration: (ms: number) => string
}

export default function WeeklyBreakdown({ weekData, formatDuration }: Props) {
  return (
    <div className="mb-4">
      {weekData.map((d) => {
        const isToday =
          d.day === ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]

        return (
          <div
            key={d.day}
            className={`flex justify-between text-sm py-1 px-2 rounded ${
              isToday ? 'bg-indigo-50 font-semibold' : ''
            }`}
          >
            <span>{d.day}</span>
            <span className={d.total ? '' : 'text-gray-400'}>
              {d.total ? formatDuration(d.total) : '0h'}
            </span>
          </div>
        )
      })}
    </div>
  )
}
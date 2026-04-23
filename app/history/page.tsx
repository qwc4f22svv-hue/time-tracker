'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { TimeLog } from '../type/time'

export default function HistoryPage() {
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('time_logs')
        .select('*')
        .order('clock_in', { ascending: false })

      setLogs(data || [])
      setLoading(false)
    }

    fetchLogs()
  }, [])

if (loading) {
  return (
    <div className="p-6 text-center text-gray-500 animate-pulse">
      Loading your data...
    </div>
  )
}

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Full History</h1>

      {logs.length === 0 ? (
        <div className="text-gray-500">No logs yet</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="border p-3 rounded mb-2 text-sm">
            <div>
              In: {new Date(log.clock_in).toLocaleString()}
            </div>
            <div>
              Out:{' '}
              {log.clock_out
                ? new Date(log.clock_out).toLocaleString()
                : 'Active'}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
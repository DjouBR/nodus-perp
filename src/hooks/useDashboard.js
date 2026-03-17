'use client'

import { useState, useEffect } from 'react'

/**
 * Hook para buscar dados do dashboard conforme o role do usuário.
 * @param {'academia'|'coach'|'athlete'} dashboardType
 */
export function useDashboard(dashboardType) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(`/api/dashboard/${dashboardType}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then(json => { if (!cancelled) { setData(json); setLoading(false) } })
      .catch(err => { if (!cancelled) { setError(err.message); setLoading(false) } })

    return () => { cancelled = true }
  }, [dashboardType])

  return { data, loading, error }
}

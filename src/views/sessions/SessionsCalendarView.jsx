'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useMediaQuery, useTheme } from '@mui/material'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import SidebarLeft from './SidebarLeft'
import SessionDrawer from './SessionDrawer'

// Mapeamento de status para cores MUI / hex
const STATUS_COLOR = {
  scheduled: '#6366f1',
  active:    '#22c55e',
  finished:  '#64748b',
  cancelled: '#ef4444',
}

// Converte registro do DB para evento do FullCalendar
const toCalendarEvent = s => ({
  id:    s.id,
  title: s.name,
  start: s.start_datetime,
  end:   s.end_datetime,
  backgroundColor: s.type_color || STATUS_COLOR[s.status] || '#6366f1',
  borderColor:     s.type_color || STATUS_COLOR[s.status] || '#6366f1',
  extendedProps: { ...s },
})

export default function SessionsCalendarView() {
  const theme = useTheme()
  const mdAbove = useMediaQuery(theme.breakpoints.up('md'))
  const calendarRef = useRef(null)

  const [events, setEvents] = useState([])
  const [sessionTypes, setSessionTypes] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  // Filtros ativos de tipo (vazio = todos)
  const [activeTypes, setActiveTypes] = useState([])
  // Data de clique para pré-preencher o drawer
  const [clickedDate, setClickedDate] = useState(null)

  // ── Fetch ──────────────────────────────────────────────
  const fetchSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions')
      const data = await res.json()
      setEvents(Array.isArray(data) ? data.map(toCalendarEvent) : [])
    } catch (err) {
      console.error('fetchSessions', err)
    }
  }, [])

  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch('/api/sessions/types')
      const data = await res.json()
      setSessionTypes(Array.isArray(data) ? data : [])
      setActiveTypes(Array.isArray(data) ? data.map(t => t.id) : [])
    } catch (err) {
      console.error('fetchTypes', err)
    }
  }, [])

  useEffect(() => {
    fetchSessions()
    fetchTypes()
  }, [])

  // ── Eventos filtrados ───────────────────────────────────
  const filteredEvents = activeTypes.length
    ? events.filter(e => activeTypes.includes(e.extendedProps.session_type_id))
    : events

  // ── Handlers ───────────────────────────────────────────
  const handleDateClick = info => {
    setSelectedSession(null)
    setClickedDate(info.dateStr)
    setDrawerOpen(true)
  }

  const handleEventClick = ({ event }) => {
    setSelectedSession(event.extendedProps)
    setClickedDate(null)
    setDrawerOpen(true)
  }

  const handleEventDrop = async ({ event }) => {
    await fetch(`/api/sessions/${event.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event.extendedProps,
        start_datetime: event.start,
        end_datetime:   event.end,
        duration_min:   event.extendedProps.duration_min,
      }),
    })
    fetchSessions()
  }

  const handleSave = async (data) => {
    const isEdit = !!data.id
    const url = isEdit ? `/api/sessions/${data.id}` : '/api/sessions'
    const method = isEdit ? 'PUT' : 'POST'
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    setDrawerOpen(false)
    setSelectedSession(null)
    fetchSessions()
  }

  const handleDelete = async (id) => {
    await fetch(`/api/sessions/${id}`, { method: 'DELETE' })
    setDrawerOpen(false)
    setSelectedSession(null)
    fetchSessions()
  }

  const handleNewSession = () => {
    setSelectedSession(null)
    setClickedDate(null)
    setDrawerOpen(true)
  }

  // ── Render ─────────────────────────────────────────────
  return (
    <div className='flex overflow-hidden rounded border border-divider bg-backgroundPaper' style={{ minHeight: '75vh' }}>
      <SidebarLeft
        mdAbove={mdAbove}
        leftSidebarOpen={leftSidebarOpen}
        sessionTypes={sessionTypes}
        activeTypes={activeTypes}
        setActiveTypes={setActiveTypes}
        calendarRef={calendarRef}
        handleLeftSidebarToggle={() => setLeftSidebarOpen(v => !v)}
        handleNewSession={handleNewSession}
      />

      <div className='p-6 pbe-0 grow overflow-visible'>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView='dayGridMonth'
          locale='pt-br'
          buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia', list: 'Lista' }}
          headerToolbar={{
            start: 'sidebarToggle, prev, next, title',
            end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
          }}
          customButtons={{
            sidebarToggle: {
              icon: 'tabler tabler-menu-2',
              click: () => setLeftSidebarOpen(v => !v)
            }
          }}
          events={filteredEvents}
          editable
          droppable
          navLinks
          dayMaxEvents={3}
          eventResizableFromStart
          direction={theme.direction}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventContent={({ event }) => (
            <div className='flex items-center gap-1 px-1 truncate text-white text-xs font-medium'>
              {event.extendedProps.type_icon && (
                <i className={`tabler-${event.extendedProps.type_icon} text-[11px]`} />
              )}
              <span className='truncate'>{event.title}</span>
            </div>
          )}
        />
      </div>

      <SessionDrawer
        open={drawerOpen}
        session={selectedSession}
        sessionTypes={sessionTypes}
        defaultDate={clickedDate}
        onClose={() => { setDrawerOpen(false); setSelectedSession(null) }}
        onSave={handleSave}
        onDelete={handleDelete}
      />
    </div>
  )
}

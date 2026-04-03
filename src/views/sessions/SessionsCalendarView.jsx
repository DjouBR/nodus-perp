'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useMediaQuery, useTheme } from '@mui/material'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import ptBrLocale from '@fullcalendar/core/locales/pt-br'

import AppFullCalendar from '@/libs/styles/AppFullCalendar'
import SidebarLeft from './SidebarLeft'
import SessionDrawer from './SessionDrawer'
import NodusToast from '@/components/NodusToast'

const colorToClass = color => {
  const map = {
    '#7367f0': 'primary', '#6366f1': 'primary', '#8c57ff': 'primary',
    '#28c76f': 'success', '#22c55e': 'success',
    '#ea5455': 'error',   '#ef4444': 'error',
    '#ff9f43': 'warning', '#f59e0b': 'warning',
    '#00cfe8': 'info',    '#06b6d4': 'info',
    '#64748b': 'secondary', '#82868b': 'secondary',
  }
  return map[color?.toLowerCase()] ?? 'primary'
}

const STATUS_COLOR = {
  scheduled: '#6366f1',
  active:    '#22c55e',
  finished:  '#64748b',
  cancelled: '#ef4444',
}

const toCalendarEvent = s => {
  const color = s.type_color || STATUS_COLOR[s.status] || '#6366f1'
  return {
    id:    s.id,
    title: s.name,
    start: s.start_datetime,
    end:   s.end_datetime,
    backgroundColor: color,
    borderColor:     color,
    classNames: [`event-bg-${colorToClass(color)}`],
    extendedProps: { ...s, _color: color },
  }
}

export default function SessionsCalendarView() {
  const theme   = useTheme()
  const mdAbove = useMediaQuery(theme.breakpoints.up('md'))
  const calendarRef = useRef(null)

  // Role do usuário logado — usado pelo SessionDrawer para exibir o botão Lobby
  const { data: authSession } = useSession()
  const userRole = authSession?.user?.role

  const [events, setEvents]                   = useState([])
  const [sessionTypes, setSessionTypes]       = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [drawerOpen, setDrawerOpen]           = useState(false)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false)
  const [activeTypes, setActiveTypes]         = useState([])
  const [clickedDate, setClickedDate]         = useState(null)
  const [toast, setToast]                     = useState({ open: false, message: '', severity: 'success' })

  const showToast = (message, severity = 'success') =>
    setToast({ open: true, message, severity })

  const fetchSessions = useCallback(async () => {
    try {
      const res  = await fetch('/api/sessions')
      const data = await res.json()
      const newEvents = Array.isArray(data) ? data.map(toCalendarEvent) : []
      setEvents(newEvents)

      // Força o FullCalendar a reprocessar os eventos imediatamente
      const calApi = calendarRef.current?.getApi()
      if (calApi) {
        calApi.removeAllEvents()
        newEvents.forEach(e => calApi.addEvent(e))
      }
    } catch (err) { console.error('fetchSessions', err) }
  }, [])

  const fetchTypes = useCallback(async () => {
    try {
      const res  = await fetch('/api/sessions/types')
      const data = await res.json()
      setSessionTypes(Array.isArray(data) ? data : [])
      setActiveTypes(Array.isArray(data) ? data.map(t => t.id) : [])
    } catch (err) { console.error('fetchTypes', err) }
  }, [])

  useEffect(() => { fetchSessions(); fetchTypes() }, [])

  // Filtra por tipo ativo. Sessões sem tipo (session_type_id null) são sempre exibidas.
  const filteredEvents = activeTypes.length
    ? events.filter(e => {
        const typeId = e.extendedProps.session_type_id
        return typeId == null || activeTypes.includes(typeId)
      })
    : events

  const handleEventClick = ({ event }) => {
    setSelectedSession(event.extendedProps)
    setClickedDate(null)
    setDrawerOpen(true)
  }

  const handleEventDrop = async ({ event }) => {
    try {
      const res = await fetch(`/api/sessions/${event.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event.extendedProps,
          start_datetime: event.start?.toISOString().slice(0, 16),
          end_datetime:   event.end,
        }),
      })
      if (!res.ok) throw new Error()
      showToast('Sessão reagendada com sucesso!')
    } catch {
      showToast('Erro ao reagendar sessão.', 'error')
    } finally {
      fetchSessions()
    }
  }

  const handleSave = async data => {
    const isEdit = !!data.id
    try {
      const res = await fetch(isEdit ? `/api/sessions/${data.id}` : '/api/sessions', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Erro desconhecido')

      if (isEdit) {
        showToast('Sessão atualizada com sucesso!')
      } else if (json.count) {
        showToast(`${json.count} sessões recorrentes criadas com sucesso!`)
      } else {
        showToast('Sessão criada com sucesso!')
      }

      setDrawerOpen(false)
      setSelectedSession(null)
      fetchSessions()
    } catch (err) {
      showToast(err.message || 'Erro ao salvar sessão.', 'error')
    }
  }

  const handleDelete = async (id, scope = 'single') => {
    try {
      const res = await fetch(`/api/sessions/${id}?scope=${scope}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      showToast(
        scope === 'future'
          ? 'Sessão e próximas ocorrências excluídas!'
          : 'Sessão excluída com sucesso!'
      )
    } catch {
      showToast('Erro ao excluir sessão.', 'error')
    } finally {
      setDrawerOpen(false)
      setSelectedSession(null)
      fetchSessions()
    }
  }

  return (
    <>
      <AppFullCalendar className='overflow-hidden rounded border border-divider bg-backgroundPaper'>
        <SidebarLeft
          mdAbove={mdAbove}
          leftSidebarOpen={leftSidebarOpen}
          sessionTypes={sessionTypes}
          activeTypes={activeTypes}
          setActiveTypes={setActiveTypes}
          calendarRef={calendarRef}
          handleLeftSidebarToggle={() => setLeftSidebarOpen(v => !v)}
          handleNewSession={() => { setSelectedSession(null); setClickedDate(null); setDrawerOpen(true) }}
        />

        <div className='pbs-6 pbe-0 pis-6 pie-6 grow overflow-hidden'>
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView='dayGridMonth'
            locale={ptBrLocale}
            buttonText={{ today: 'Hoje', month: 'Mês', week: 'Semana', day: 'Dia', list: 'Lista' }}
            allDayText='Dia inteiro'
            headerToolbar={{
              start: 'prev,next title',
              end:   'dayGridMonth,timeGridWeek,timeGridDay,listMonth'
            }}
            height='100%'
            events={filteredEvents}
            editable droppable navLinks
            dayMaxEvents={3}
            eventResizableFromStart
            direction={theme.direction}
            dateClick={info => { setSelectedSession(null); setClickedDate(info.dateStr); setDrawerOpen(true) }}
            eventClick={handleEventClick}
            eventDrop={handleEventDrop}
          />
        </div>

        <SessionDrawer
          open={drawerOpen}
          session={selectedSession}
          sessionTypes={sessionTypes}
          defaultDate={clickedDate}
          userRole={userRole}
          onClose={() => { setDrawerOpen(false); setSelectedSession(null) }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </AppFullCalendar>

      <NodusToast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={() => setToast(t => ({ ...t, open: false }))}
      />
    </>
  )
}

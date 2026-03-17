'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Skeleton from '@mui/material/Skeleton'
import OptionMenu from '@core/components/option-menu'

// ── Empty state ──────────────────────────────────────────────────────
const EmptySessions = () => (
  <div className='flex flex-col items-center justify-center py-8 gap-2 text-center'>
    <i className='tabler-calendar-off text-4xl text-secondary opacity-50' />
    <Typography variant='body1' className='font-semibold'>Nenhuma sessão hoje</Typography>
    <Typography variant='body2' color='textSecondary'>Crie a primeira sessão pelo menu Sessões.</Typography>
  </div>
)

const statusColor = { scheduled: 'default', active: 'success', finished: 'secondary', cancelled: 'error', andamento: 'success', encerrada: 'secondary', agendada: 'default' }
const statusLabel = { scheduled: 'Agendada', active: 'Em andamento', finished: 'Encerrada', cancelled: 'Cancelada', andamento: 'Em andamento', encerrada: 'Encerrada', agendada: 'Agendada' }

const SessionsTableCard = ({ sessions = [], loading = false }) => (
  <Card className='h-full'>
    <CardHeader
      title='Sessões de Hoje'
      avatar={<i className='tabler-calendar text-primary text-2xl' />}
      action={<OptionMenu options={['Hoje', 'Esta semana', 'Este mês']} />}
    />
    <CardContent>
      {loading ? (
        [1,2,3].map(i => <Skeleton key={i} variant='rounded' height={40} className='mb-2' />)
      ) : sessions.length === 0 ? (
        <EmptySessions />
      ) : (
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b'>
                <th className='text-left py-2 pr-4 font-medium text-textSecondary'>Sessão</th>
                <th className='text-left py-2 pr-4 font-medium text-textSecondary'>Horário</th>
                <th className='text-left py-2 pr-4 font-medium text-textSecondary'>Coach</th>
                <th className='text-center py-2 pr-4 font-medium text-textSecondary'>Atletas</th>
                <th className='text-center py-2 font-medium text-textSecondary'>Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.id || i} className='border-b border-divider last:border-0'>
                  <td className='py-3 pr-4'>
                    <Typography variant='body2' className='font-semibold'>{s.name}</Typography>
                  </td>
                  <td className='py-3 pr-4'>
                    <Typography variant='body2' color='textSecondary'>{s.time || '—'}</Typography>
                  </td>
                  <td className='py-3 pr-4'>
                    <Typography variant='body2'>{s.coach || '—'}</Typography>
                  </td>
                  <td className='py-3 pr-4 text-center'>
                    <Typography variant='body2'>{s.participants_count ?? s.athletes ?? '—'}</Typography>
                  </td>
                  <td className='py-3 text-center'>
                    <Chip
                      label={statusLabel[s.status] || s.status}
                      color={statusColor[s.status] || 'default'}
                      size='small'
                      variant='tonal'
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardContent>
  </Card>
)

export default SessionsTableCard

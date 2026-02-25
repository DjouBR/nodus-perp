'use client'

import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Link from 'next/link'

const statusConfig = {
  andamento: { label: 'Ao Vivo',   color: 'error'   },
  agendada:  { label: 'Agendada',  color: 'primary' },
  encerrada: { label: 'Encerrada', color: 'default' },
}

const SessionsTableCard = ({ sessions = [] }) => {
  return (
    <Card>
      <CardHeader
        title='Sessões de Hoje'
        action={
          <Button size='small' component={Link} href='/sessions'>
            Ver todas
          </Button>
        }
        avatar={<i className='tabler-calendar-event text-primary text-2xl' />}
      />
      <CardContent className='pt-0'>
        <TableContainer>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <TableCell>Sessão</TableCell>
                <TableCell>Horário</TableCell>
                <TableCell>Coach</TableCell>
                <TableCell align='center'>Atletas</TableCell>
                <TableCell align='center'>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sessions.map((s, i) => {
                const cfg = statusConfig[s.status] ?? statusConfig.agendada
                return (
                  <TableRow key={i} hover>
                    <TableCell>
                      <Typography variant='body2' className='font-medium'>{s.name}</Typography>
                    </TableCell>
                    <TableCell>{s.time}</TableCell>
                    <TableCell>{s.coach}</TableCell>
                    <TableCell align='center'>{s.athletes}</TableCell>
                    <TableCell align='center'>
                      <Chip label={cfg.label} color={cfg.color} size='small'
                        icon={s.status === 'andamento' ? <i className='tabler-radio text-xs ml-1' /> : undefined} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  )
}

export default SessionsTableCard

// MUI Imports
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'

const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
  <Card>
    <CardContent className='flex items-center justify-between gap-4'>
      <div>
        <Typography variant='h5' className='font-bold'>{value}</Typography>
        <Typography variant='body2' color='textSecondary'>{title}</Typography>
        {subtitle && <Typography variant='caption' color='textSecondary'>{subtitle}</Typography>}
      </div>
      <div className={`flex items-center justify-center rounded-full w-12 h-12 bg-${color}/10`}>
        <i className={`${icon} text-${color} text-2xl`} />
      </div>
    </CardContent>
  </Card>
)

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Dashboard</Typography>
        <Typography variant='body2' color='textSecondary'>Visão geral do sistema NODUS</Typography>
      </div>

      <Grid container spacing={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Academias Ativas'
            value='12'
            subtitle='+2 este mês'
            icon='tabler-building-community'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Atletas Cadastrados'
            value='348'
            subtitle='+24 esta semana'
            icon='tabler-users'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Sessões Hoje'
            value='47'
            subtitle='Em andamento: 3'
            icon='tabler-activity'
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title='Daily Logs Hoje'
            value='89'
            subtitle='Compliance: 76%'
            icon='tabler-clipboard-text'
          />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' className='mb-4'>Sessões Recentes</Typography>
              <Typography variant='body2' color='textSecondary'>
                🚧 Tabela de sessões recentes será implementada aqui.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant='h6' className='mb-4'>Alertas e Notificações</Typography>
              <div className='flex flex-col gap-2'>
                <div className='flex items-center gap-2'>
                  <Chip label='Overtraining' color='error' size='small' />
                  <Typography variant='body2'>3 atletas com ACWR &gt; 1.5</Typography>
                </div>
                <div className='flex items-center gap-2'>
                  <Chip label='HRV Baixo' color='warning' size='small' />
                  <Typography variant='body2'>5 atletas com HRV abaixo do baseline</Typography>
                </div>
                <div className='flex items-center gap-2'>
                  <Chip label='Compliance' color='info' size='small' />
                  <Typography variant='body2'>12 atletas sem daily log hoje</Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

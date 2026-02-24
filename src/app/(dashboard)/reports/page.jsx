// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'

const reportTypes = [
  { title: 'Relatório Individual', desc: 'FC vs tempo, zonas, TRIMP, comparativo com histórico', icon: 'tabler-user-circle', href: '#' },
  { title: 'Relatório de Academia', desc: 'Taxa de retenção, análise de horários, ROI do monitoramento', icon: 'tabler-building-community', href: '#' },
  { title: 'Carga Semanal', desc: 'ACWR, monotonia, strain, progresso de carga', icon: 'tabler-chart-line', href: '#' },
  { title: 'Bem-Estar (WBS)', desc: 'HRV, sono, energia, humor e readiness ao longo do tempo', icon: 'tabler-heart-rate', href: '#' },
  { title: 'Periodização', desc: 'Carga planificada vs real, mesociclos, compliance', icon: 'tabler-calendar-stats', href: '#' },
  { title: 'Conformidade LGPD', desc: 'Auditoria de dados e relatório de conformidade', icon: 'tabler-shield-check', href: '#' }
]

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Relatórios</Typography>
        <Typography variant='body2' color='textSecondary'>Análise científica de desempenho, carga e bem-estar</Typography>
      </div>

      <Grid container spacing={3}>
        {reportTypes.map(r => (
          <Grid item xs={12} sm={6} md={4} key={r.title}>
            <Card className='h-full'>
              <CardContent className='flex flex-col gap-3'>
                <i className={`${r.icon} text-4xl text-primary`} />
                <Typography variant='h6' className='font-bold'>{r.title}</Typography>
                <Typography variant='body2' color='textSecondary' className='flex-1'>{r.desc}</Typography>
                <Button variant='outlined' fullWidth startIcon={<i className='tabler-download' />}>
                  Gerar Relatório
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

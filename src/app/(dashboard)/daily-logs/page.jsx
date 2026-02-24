// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import LinearProgress from '@mui/material/LinearProgress'

const logsMock = [
  {
    id: 1,
    athlete: 'Lucas Oliveira',
    date: '24/02/2026',
    hrv: 72,
    restHr: 48,
    sleep: 8,
    sleepWbs: 8,
    energy: 7,
    muscleSoreness: 2,
    mood: 8,
    readiness: 8
  },
  {
    id: 2,
    athlete: 'Rafael Mendes',
    date: '24/02/2026',
    hrv: 38,
    restHr: 68,
    sleep: 5,
    sleepWbs: 4,
    energy: 3,
    muscleSoreness: 7,
    mood: 4,
    readiness: 3
  }
]

const wbsColor = v => v >= 7 ? 'success' : v >= 5 ? 'warning' : 'error'

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between'>
        <div>
          <Typography variant='h4' className='font-bold'>Daily Logs</Typography>
          <Typography variant='body2' color='textSecondary'>HRV matinal, WBS, sono, energia e readiness diária</Typography>
        </div>
        <Button variant='contained' startIcon={<i className='tabler-plus' />}>
          Novo Log
        </Button>
      </div>

      <div className='flex flex-col gap-4'>
        {logsMock.map(log => (
          <Card key={log.id}>
            <CardHeader
              title={log.athlete}
              subheader={log.date}
              action={
                <Chip
                  label={`Readiness: ${log.readiness}/10`}
                  color={wbsColor(log.readiness)}
                  size='small'
                />
              }
            />
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div>
                  <Typography variant='caption' color='textSecondary'>HRV Matinal</Typography>
                  <Typography variant='h6' className='font-bold'>{log.hrv} <span className='text-sm font-normal'>ms</span></Typography>
                </div>
                <div>
                  <Typography variant='caption' color='textSecondary'>FC Repouso</Typography>
                  <Typography variant='h6' className='font-bold'>{log.restHr} <span className='text-sm font-normal'>bpm</span></Typography>
                </div>
                <div>
                  <Typography variant='caption' color='textSecondary'>Sono</Typography>
                  <Typography variant='h6' className='font-bold'>{log.sleep}h</Typography>
                </div>
                <div>
                  <Typography variant='caption' color='textSecondary'>Energia</Typography>
                  <Typography variant='h6' className='font-bold'>{log.energy}/10</Typography>
                </div>
              </div>
              <div className='mt-4 grid grid-cols-2 md:grid-cols-4 gap-2'>
                {[
                  { label: 'Sono WBS', value: log.sleepWbs },
                  { label: 'Energia', value: log.energy },
                  { label: 'Dor Muscular', value: log.muscleSoreness, invert: true },
                  { label: 'Humor', value: log.mood }
                ].map(({ label, value, invert }) => (
                  <div key={label}>
                    <div className='flex justify-between mb-1'>
                      <Typography variant='caption'>{label}</Typography>
                      <Typography variant='caption'>{value}/10</Typography>
                    </div>
                    <LinearProgress
                      variant='determinate'
                      value={value * 10}
                      color={invert ? (value > 5 ? 'error' : 'success') : wbsColor(value)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

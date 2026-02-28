// src/app/(dashboard)/athlete/settings/page.jsx
// Acesso: athlete
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

export default function AthleteSettingsPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Configurações da Conta</Typography>
        <Typography variant='body2' color='textSecondary'>Preferências pessoais, notificações e privacidade</Typography>
      </div>
      <Grid container spacing={4}>
        {[
          { title: 'Notificações', desc: '🚧 Tipo de notificações recebidas (treino, pagamento, desafios).' },
          { title: 'Lembretes de Treino', desc: '🚧 Configurar lembretes automáticos antes das sessões.' },
          { title: 'Privacidade', desc: '🚧 Perfil público ou privado para gamificação e desafios.' },
          { title: 'Meu Sensor', desc: '🚧 Sensor vinculado, status de bateria e configurações ANT+/BLE.' },
          { title: 'Metas Pessoais', desc: '🚧 Meta de calorias, sessões por semana, zona alvo preferida.' },
        ].map(({ title, desc }) => (
          <Grid item xs={12} md={6} key={title}>
            <Card><CardHeader title={title} /><CardContent>
              <Typography variant='body2' color='textSecondary'>{desc}</Typography>
            </CardContent></Card>
          </Grid>
        ))}
      </Grid>
    </div>
  )
}

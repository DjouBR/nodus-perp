// src/app/(dashboard)/coach/settings/page.jsx
// Acesso: coach
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

export default function CoachSettingsPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Configurações do Coach</Typography>
        <Typography variant='body2' color='textSecondary'>Preferências pessoais de notificações, alertas e relatórios</Typography>
      </div>
      <Grid container spacing={4}>
        {[
          { title: 'Notificações', desc: '🚧 Tipos de notificação recebidos (app, e-mail, push).' },
          { title: 'Alertas do Sistema', desc: '🚧 FC crítica, ACWR elevado, atleta sem treino.' },
          { title: 'Temporizadores de Sessão', desc: '🚧 Configurar timers padrão para aquecimento, blocos e descanso.' },
          { title: 'Layout de Relatórios', desc: '🚧 Escolher métricas exibidas nos relatórios de sessão.' },
          { title: 'Visualização de Zonas', desc: '🚧 Paleta de cores e exibição padrão de zonas de FC.' },
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

// src/app/(dashboard)/receptionist/settings/page.jsx
// Acesso: receptionist
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

export default function ReceptionistSettingsPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Configurações da Conta</Typography>
        <Typography variant='body2' color='textSecondary'>Preferências pessoais e notificações</Typography>
      </div>
      <Grid container spacing={4}>
        {[
          { title: 'Notificações', desc: '🚧 Tipo de notificações recebidas (check-ins, pagamentos, aniversários).' },
          { title: 'Preferências de Visualização', desc: '🚧 Colunas exibidas na listagem de atletas e pagamentos.' },
          { title: 'Alertas de Pagamento', desc: '🚧 Notificar sobre inadimplências e vencimentos próximos.' },
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

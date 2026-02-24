// MUI Imports
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import Grid from '@mui/material/Grid'

export default function Page() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Configurações</Typography>
        <Typography variant='body2' color='textSecondary'>Preferências do sistema, perfil e integrações</Typography>
      </div>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title='Perfil do Usuário' />
            <CardContent>
              <Typography variant='body2' color='textSecondary'>
                🚧 Formulário de editação de perfil será implementado aqui.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title='Notificações' />
            <CardContent>
              <Typography variant='body2' color='textSecondary'>
                🚧 Preferências de notificação serão implementadas aqui.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title='Integrações' subheader='ANT+, Bluetooth, WebSocket' />
            <CardContent>
              <Typography variant='body2' color='textSecondary'>
                🚧 Configuração de dispositivos e integrações será implementada aqui.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title='Plano e Assinatura' />
            <CardContent>
              <Typography variant='body2' color='textSecondary'>
                🚧 Gestão do plano e fatura será implementada aqui.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}

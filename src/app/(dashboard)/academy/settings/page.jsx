// src/app/(dashboard)/academy/settings/page.jsx
// Acesso: tenant_admin
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

export default function AcademySettingsPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Configurações da Academia</Typography>
        <Typography variant='body2' color='textSecondary'>Personalização do sistema para sua unidade</Typography>
      </div>
      <Grid container spacing={4}>
        {[
          { title: 'Tela de Monitoramento', desc: '🚧 O que exibir nos tiles: BPM, zona, calorias, nome, foto.' },
          { title: 'Tela de Exibição (TV)', desc: '🚧 Layout e informações exibidas na tela do projetor/TV.' },
          { title: 'Permissões de Subordinados', desc: '🚧 O que coaches, recepcionistas e atletas podem ver e editar.' },
          { title: 'Zonas de FC da Academia', desc: '🚧 Personalizar limites de Z1–Z5 e paleta de cores.' },
          { title: 'Notificações e Alertas', desc: '🚧 FC crítica, ausências prolongadas, aniversários.' },
          { title: 'Modalidades e Planos', desc: '🚧 Tipos de aula e planos de matrícula disponíveis.' },
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

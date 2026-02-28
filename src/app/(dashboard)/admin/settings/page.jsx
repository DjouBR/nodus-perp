// src/app/(dashboard)/admin/settings/page.jsx
// Acesso: super_admin
import Card from '@mui/material/Card'
import CardHeader from '@mui/material/CardHeader'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Grid from '@mui/material/Grid'

export default function AdminSettingsPage() {
  return (
    <div className='flex flex-col gap-6'>
      <div>
        <Typography variant='h4' className='font-bold'>Configurações do Sistema</Typography>
        <Typography variant='body2' color='textSecondary'>Controle global do SaaS — planos, features, RBAC e integrações</Typography>
      </div>
      <Grid container spacing={4}>
        {[
          { title: 'Controle de Features / Beta', desc: '🚧 Habilitar/desabilitar funcionalidades por tenant ou plano.' },
          { title: 'Gestão de Planos e Limites', desc: '🚧 Configurar recursos e limites por plano (Basic, Pro, Enterprise).' },
          { title: 'Cupons e Promoções', desc: '🚧 Criar e gerenciar cupons de desconto para tenants.' },
          { title: 'Permissões RBAC', desc: '🚧 Editor de roles e permissões por tipo de tenant.' },
          { title: 'Integrações Globais', desc: '🚧 Gateways de pagamento, provedores de e-mail/SMS, APIs externas.' },
          { title: 'Parâmetros de Zonas de FC', desc: '🚧 Limites padrão de Z1–Z5 usados como base para todos os tenants.' },
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

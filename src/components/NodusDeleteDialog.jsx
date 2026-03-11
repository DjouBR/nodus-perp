'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Divider from '@mui/material/Divider'
import Chip from '@mui/material/Chip'

/**
 * Diálogo de exclusão permanente genérico com 3 opções:
 *   - Cancelar
 *   - Backup e excluir  (chama onDelete({ backup: true }))
 *   - Apenas excluir    (chama onDelete({ backup: false }))
 *
 * Props:
 *   open        {boolean}   — visibilidade
 *   title       {string}    — título do diálogo  (ex: 'Excluir treinador')
 *   name        {string}    — nome do item a excluir
 *   subtitle    {string}    — informação secundária (email, tipo etc.)
 *   items       {string[]}  — lista do que será excluído
 *   loading     {boolean}   — estado de carregamento
 *   onDelete    {function}  — callback({ backup: boolean })
 *   onCancel    {function}  — callback ao cancelar
 */
export default function NodusDeleteDialog({
  open,
  title = 'Excluir permanentemente',
  name,
  subtitle,
  items = [],
  loading = false,
  onDelete,
  onCancel,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth='sm'
      fullWidth
      PaperProps={{ className: 'rounded-xl' }}
    >
      <DialogTitle className='flex items-center gap-2 pb-1'>
        <i className='tabler-alert-triangle text-error text-2xl' />
        {title}
      </DialogTitle>

      <DialogContent className='pt-2'>
        <DialogContentText className='mb-3'>
          Você está prestes a excluir permanentemente:
        </DialogContentText>

        {/* Card identificação */}
        <div className='mb-4 flex items-center gap-3 rounded-lg border border-error/30 bg-error/5 p-3'>
          <i className='tabler-user-x text-error text-2xl' />
          <div>
            <p className='font-semibold'>{name}</p>
            {subtitle && <p className='text-sm text-textSecondary'>{subtitle}</p>}
          </div>
        </div>

        {/* Lista do que será excluído */}
        {items.length > 0 && (
          <div className='rounded-lg bg-warning/5 border border-warning/20 p-3 mb-3'>
            <p className='mb-1.5 text-sm font-medium text-warning flex items-center gap-1.5'>
              <i className='tabler-info-circle' />
              Será excluído permanentemente:
            </p>
            <ul className='space-y-1 pl-5 text-sm text-textSecondary list-disc'>
              {items.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}

        <Divider className='my-2' />
        <Chip
          icon={<i className='tabler-lock text-xs' />}
          label='Esta ação não pode ser desfeita'
          color='error'
          variant='outlined'
          size='small'
        />
      </DialogContent>

      <DialogActions className='flex-col gap-2 px-4 pb-4 sm:flex-row'>
        <Button variant='outlined' color='secondary' onClick={onCancel}
          disabled={loading} startIcon={<i className='tabler-x' />} fullWidth>
          Cancelar
        </Button>
        <Button variant='outlined' color='warning'
          onClick={() => onDelete({ backup: true })}
          disabled={loading}
          startIcon={loading
            ? <i className='tabler-loader-2 animate-spin' />
            : <i className='tabler-database-export' />}
          fullWidth>
          Backup e excluir
        </Button>
        <Button variant='contained' color='error'
          onClick={() => onDelete({ backup: false })}
          disabled={loading}
          startIcon={loading
            ? <i className='tabler-loader-2 animate-spin' />
            : <i className='tabler-trash' />}
          fullWidth>
          Apenas excluir
        </Button>
      </DialogActions>
    </Dialog>
  )
}

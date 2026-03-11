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
 * Diálogo de exclusão de atleta com 3 opções:
 *   - Fazer backup e excluir  (chama onDelete com backup=true)
 *   - Apenas excluir          (chama onDelete com backup=false)
 *   - Cancelar
 *
 * Props:
 *   open     {boolean}   — visibilidade
 *   athlete  {object}    — { name, email }
 *   loading  {boolean}   — estado de carregamento
 *   onDelete {function}  — callback({ backup: boolean })
 *   onCancel {function}  — callback ao cancelar
 */
export default function NodusDeleteAthleteDialog({ open, athlete, loading, onDelete, onCancel }) {
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
        Excluir atleta permanentemente
      </DialogTitle>

      <DialogContent className='pt-2'>
        <DialogContentText className='mb-3'>
          Você está prestes a excluir permanentemente o atleta:
        </DialogContentText>

        {/* Card com info do atleta */}
        <div className='mb-4 flex items-center gap-3 rounded-lg border border-error/30 bg-error/5 p-3'>
          <i className='tabler-user-x text-error text-2xl' />
          <div>
            <p className='font-semibold'>{athlete?.name}</p>
            <p className='text-sm text-textSecondary'>{athlete?.email}</p>
          </div>
        </div>

        {/* Aviso do que será excluído */}
        <div className='rounded-lg bg-warning/5 border border-warning/20 p-3 mb-3'>
          <p className='mb-1.5 text-sm font-medium text-warning flex items-center gap-1.5'>
            <i className='tabler-info-circle' />
            Será excluído permanentemente:
          </p>
          <ul className='space-y-1 pl-5 text-sm text-textSecondary list-disc'>
            <li>Dados pessoais e credenciais de acesso</li>
            <li>Ficha esportiva (FC, peso, altura, metas)</li>
            <li>Histórico de sessões de treino</li>
            <li>Logs diários e índices semanais (ACWR)</li>
            <li>Sensores vinculados</li>
          </ul>
        </div>

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
        {/* Botão Cancelar */}
        <Button
          variant='outlined'
          color='secondary'
          onClick={onCancel}
          disabled={loading}
          startIcon={<i className='tabler-x' />}
          fullWidth
        >
          Cancelar
        </Button>

        {/* Botão Backup + Excluir */}
        <Button
          variant='outlined'
          color='warning'
          onClick={() => onDelete({ backup: true })}
          disabled={loading}
          startIcon={loading
            ? <i className='tabler-loader-2 animate-spin' />
            : <i className='tabler-database-export' />}
          fullWidth
        >
          Backup e excluir
        </Button>

        {/* Botão Apenas Excluir */}
        <Button
          variant='contained'
          color='error'
          onClick={() => onDelete({ backup: false })}
          disabled={loading}
          startIcon={loading
            ? <i className='tabler-loader-2 animate-spin' />
            : <i className='tabler-trash' />}
          fullWidth
        >
          Apenas excluir
        </Button>
      </DialogActions>
    </Dialog>
  )
}

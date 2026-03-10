'use client'

import { useEffect, useRef } from 'react'
import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'

/**
 * Diálogo de confirmação padrão NODUS (usa MUI Dialog — mesma aparência do template Vuexy)
 *
 * Props:
 *   open        {boolean}    — controla visibilidade
 *   title       {string}     — título do dialog
 *   message     {string}     — mensagem de confirmação
 *   confirmText {string}     — texto do botão confirmar (default: 'Confirmar')
 *   cancelText  {string}     — texto do botão cancelar  (default: 'Cancelar')
 *   color       {string}     — cor MUI do botão confirmar: 'error' | 'warning' | 'success' | 'primary'
 *   loading     {boolean}    — estado de carregamento
 *   onConfirm   {function}   — callback ao confirmar
 *   onCancel    {function}   — callback ao cancelar
 */
export default function NodusConfirmDialog({
  open,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  color = 'error',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onCancel}
      maxWidth='xs'
      fullWidth
      PaperProps={{ className: 'rounded-xl' }}
    >
      <DialogTitle className='flex items-center gap-2'>
        {color === 'error'   && <i className='tabler-alert-triangle text-error text-xl' />}
        {color === 'warning' && <i className='tabler-alert-circle text-warning text-xl' />}
        {color === 'success' && <i className='tabler-circle-check text-success text-xl' />}
        {color === 'primary' && <i className='tabler-info-circle text-primary text-xl' />}
        {title}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions className='px-4 pb-4 gap-2'>
        <Button
          variant='outlined'
          color='secondary'
          onClick={onCancel}
          disabled={loading}
        >
          {cancelText}
        </Button>
        <Button
          variant='contained'
          color={color}
          onClick={onConfirm}
          disabled={loading}
          startIcon={loading ? <i className='tabler-loader-2 animate-spin' /> : null}
        >
          {loading ? 'Aguarde...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

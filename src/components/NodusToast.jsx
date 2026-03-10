'use client'

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Snackbar from '@mui/material/Snackbar'

/**
 * Toast padrão NODUS (usa MUI Snackbar + Alert — mesma aparência do template Vuexy)
 *
 * Props:
 *   open      {boolean}                       — visibilidade
 *   message   {string}                        — mensagem
 *   severity  {'success'|'error'|'warning'|'info'} — tipo
 *   onClose   {function}                      — callback ao fechar
 *   duration  {number}                        — ms antes de fechar automaticamente (default: 4000)
 */
export default function NodusToast({
  open,
  message,
  severity = 'success',
  onClose,
  duration = 4000,
}) {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant='filled'
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  )
}

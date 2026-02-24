'use client'

// Third-party Imports
import classnames from 'classnames'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Util Imports
import { verticalLayoutClasses } from '@layouts/utils/layoutClasses'

const FooterContent = () => {
  const { isBreakpointReached } = useVerticalNav()

  return (
    <div
      className={classnames(verticalLayoutClasses.footerContent, 'flex items-center justify-between flex-wrap gap-4')}
    >
      <p className='text-textSecondary text-sm'>
        {`© ${new Date().getFullYear()} NODUS — Monitoramento Cardíaco Inteligente`}
      </p>
      {!isBreakpointReached && (
        <p className='text-textSecondary text-xs'>
          v0.1.0
        </p>
      )}
    </div>
  )
}

export default FooterContent

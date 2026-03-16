const themeConfig = {
  templateName: 'NODUS',
  homePageUrl: '/home',
  settingsCookieName: 'nodus-settings-v1',
  mode: 'system', // 'system', 'light', 'dark'
  skin: 'default', // 'default', 'bordered'
  semiDark: false,
  layout: 'vertical', // 'vertical', 'collapsed', 'horizontal'
  layoutPadding: 24,
  compactContentWidth: 1440,
  navbar: {
    type: 'fixed',
    contentWidth: 'compact',
    floating: true,
    detached: true,
    blur: true
  },
  contentWidth: 'wide',
  footer: {
    type: 'static',
    contentWidth: 'compact',
    detached: true
  },
  disableRipple: false
}

export default themeConfig

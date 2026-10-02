export const THEME_STORAGE_KEY = 'portfolio-theme'

// Runs in the document head before paint; CSS supplies the system default when
// no preference is saved, including when JavaScript or storage is unavailable.
export const themeInitScript = `try {
  const theme = localStorage.getItem('${THEME_STORAGE_KEY}');
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme;
} catch {}`

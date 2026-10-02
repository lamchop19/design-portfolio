export const WORK_VIEW_STORAGE_KEY = 'work-view'

export type WorkView = 'index' | 'passes'

// Runs in the document head before paint, so a saved Passes view never flashes
// the index first. Its presence also tells CSS that JS is on and the switch
// can be shown; without it the index stands alone.
export const workViewInitScript = `try {
  document.documentElement.dataset.workView = localStorage.getItem('${WORK_VIEW_STORAGE_KEY}') === 'passes' ? 'passes' : 'index';
} catch { document.documentElement.dataset.workView = 'index'; }`

/**
 * Copy stamp: clicking the email copies it and drops a passport stamp where
 * the click landed. The mailto still opens; the stamp just confirms the copy.
 */
export function stamp(root: HTMLElement) {
  const click = (event: MouseEvent) => {
    const link = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="mailto"]')
    if (!link) return
    const address = link.getAttribute('href')!.replace(/^mailto:/, '')
    // Stamp straight away; the clipboard can be slow to answer, or refuse.
    const mark = drop(event.clientX, event.clientY, 'Copied')
    const refused = () => {
      const word = mark.querySelector('span')
      if (word) word.textContent = 'Opening mail'
    }
    if (navigator.clipboard) navigator.clipboard.writeText(address).catch(refused)
    else refused()
  }

  const drop = (x: number, y: number, word: string) => {
    const mark = document.createElement('div')
    mark.className = 'lab-stamp'
    mark.setAttribute('role', 'status')
    mark.style.left = `${x}px`
    mark.style.top = `${y}px`
    const day = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }).format(new Date())
    mark.innerHTML = `<span>${word}</span><b>NYC</b><span>${day.toUpperCase()}</span>`
    document.body.appendChild(mark)
    setTimeout(() => mark.remove(), 2200)
    return mark
  }

  root.addEventListener('click', click)
  return () => root.removeEventListener('click', click)
}

// Browser-only QA helper; never changes the live DOM.
export function baseLabel(element) {
  if (!element || typeof element.cloneNode !== 'function') throw new TypeError('Element required');
  const copy = element.cloneNode(true);
  copy.querySelectorAll('rt,rp,.furigana-rt').forEach(node => node.remove());
  return copy.textContent.replace(/\s+/g, '');
}

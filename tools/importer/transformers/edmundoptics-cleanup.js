/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Edmund Optics cleanup.
 * Removes non-authorable site chrome (header, footer) from the DOM.
 * Selectors validated against migration-work/cleaned.html.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // No cookie banners or overlays found in cleaned HTML
    // No broken HTML or overflow issues to fix
  }
  if (hookName === TransformHook.afterTransform) {
    // Remove non-authorable content: header and footer
    // Found in cleaned.html: <header> (line 3) and <footer class="eoFooter"> (line 197)
    WebImporter.DOMUtils.remove(element, [
      'header',
      'footer.eoFooter'
    ]);
  }
}

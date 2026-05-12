/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Edmund Optics sections.
 * Inserts section breaks (<hr>) and Section Metadata blocks based on template sections.
 * Selectors validated against migration-work/cleaned.html:
 *   - section.shop-by-cat (line 16)
 *   - section.banners / #compartBanner (line 70)
 *   - section.feat-prods (line 102)
 *   - section.knowledge-center (line 150)
 *   - section.contactbanner_whitefooter (line 174)
 *
 * Live DOM uses div elements instead of section tags, so fallback selectors
 * strip the tag prefix (e.g. "section.shop-by-cat" -> ".shop-by-cat").
 * The banners section uses #compartBanner on the live page.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

/**
 * Fallback selector map for sections whose live DOM selector differs from cleaned HTML.
 * Key: template selector, Value: alternative selector for the live page.
 */
const FALLBACK_SELECTORS = {
  'section.banners': '#compartBanner',
};

/**
 * Finds a section element using the template selector with fallbacks.
 * Tries: exact selector -> class-only selector -> fallback map.
 */
function findSection(scope, selector) {
  // Try exact selector first (works on cleaned HTML with <section> tags)
  let el = scope.querySelector(selector);
  if (el) return el;

  // Try without the tag prefix (e.g. "section.shop-by-cat" -> ".shop-by-cat")
  if (selector.startsWith('section.')) {
    el = scope.querySelector(selector.replace('section', ''));
    if (el) return el;
  }

  // Try fallback selector from map
  const fallback = FALLBACK_SELECTORS[selector];
  if (fallback) {
    el = scope.querySelector(fallback);
    if (el) return el;
  }

  return null;
}

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.afterTransform) {
    const { template } = payload;
    if (!template || !template.sections || template.sections.length < 2) return;

    const document = element.ownerDocument;
    const sections = template.sections;

    // Process sections in reverse order to avoid position shifts
    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      const sectionEl = findSection(element, section.selector);
      if (!sectionEl) continue;

      // Add Section Metadata block if section has a style
      if (section.style) {
        const metaBlock = WebImporter.Blocks.createBlock(document, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        sectionEl.append(metaBlock);
      }

      // Insert <hr> before each section except the first
      if (i > 0) {
        const hr = document.createElement('hr');
        sectionEl.before(hr);
      }
    }
  }
}

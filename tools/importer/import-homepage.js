/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import cardsCategoryParser from './parsers/cards-category.js';
import heroBrandParser from './parsers/hero-brand.js';
import cardsPromoParser from './parsers/cards-promo.js';
import heroEventParser from './parsers/hero-event.js';
import cardsProductParser from './parsers/cards-product.js';
import cardsArticleParser from './parsers/cards-article.js';
import columnsContactParser from './parsers/columns-contact.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/edmundoptics-cleanup.js';
import sectionsTransformer from './transformers/edmundoptics-sections.js';

// PARSER REGISTRY
const parsers = {
  'cards-category': cardsCategoryParser,
  'hero-brand': heroBrandParser,
  'cards-promo': cardsPromoParser,
  'hero-event': heroEventParser,
  'cards-product': cardsProductParser,
  'cards-article': cardsArticleParser,
  'columns-contact': columnsContactParser,
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  sectionsTransformer,
];

// PAGE TEMPLATE CONFIGURATION
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Edmund Optics homepage with hero, product categories, and promotional content',
  urls: ['https://www.edmundoptics.com/'],
  blocks: [
    {
      name: 'cards-category',
      instances: ['.shop-by-cat .row'],
    },
    {
      name: 'hero-brand',
      instances: ['#bannerParent1'],
    },
    {
      name: 'cards-promo',
      instances: ['#bannerParent2', '#bannerParent3'],
    },
    {
      name: 'hero-event',
      instances: ['#bannerParent4'],
    },
    {
      name: 'cards-product',
      instances: ['.feat-prods .row'],
    },
    {
      name: 'cards-article',
      instances: ['#dv-resources .row.respd:has(.card-rc)'],
    },
    {
      name: 'columns-contact',
      instances: ['.contactbanner_whitefooter .row'],
    },
  ],
  sections: [
    {
      id: 'section-1',
      name: 'Shop by Category',
      selector: '.shop-by-cat',
      style: null,
      blocks: ['cards-category'],
      defaultContent: ['.shop-by-cat h2'],
    },
    {
      id: 'section-2',
      name: 'Hero Banners',
      selector: 'section.banners',
      style: null,
      blocks: ['hero-brand', 'cards-promo', 'hero-event'],
      defaultContent: [],
    },
    {
      id: 'section-3',
      name: 'Featured Products',
      selector: 'section.feat-prods',
      style: null,
      blocks: ['cards-product'],
      defaultContent: ['section.feat-prods h2'],
    },
    {
      id: 'section-4',
      name: 'Knowledge Center',
      selector: '#dv-resources',
      style: null,
      blocks: ['cards-article'],
      defaultContent: ['#dv-resources .homepageh1', '#dv-resources h3', '#dv-resources .btn-other'],
    },
    {
      id: 'section-5',
      name: 'Contact Banner',
      selector: '.contactbanner_whitefooter',
      style: 'dark',
      blocks: ['columns-contact'],
      defaultContent: [],
    },
  ],
};

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Execute beforeTransform transformers (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers
    pageBlocks.forEach((block) => {
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Execute afterTransform transformers (final cleanup + section breaks)
    executeTransformers('afterTransform', main, payload);

    // 5. Apply WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};

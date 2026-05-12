/* eslint-disable */
/* global WebImporter */

/**
 * Parser for cards-product.
 * Base block: cards
 * Source: https://www.edmundoptics.com/
 * Selector: .feat-prods .row
 * Generated: 2026-05-06
 * Validated: manually against source.html (6 cards) and live DOM structure (Cloudflare blocks headless validator)
 *
 * Converts a grid of product card anchors into a Cards block table.
 * Each card becomes one row: [product image] | [product name + description + link]
 *
 * Live DOM structure per card:
 *   <a href="...">
 *     <div class="img-style">
 *       <img class="carousel__item__image" alt="..." src="...">
 *     </div>
 *     <div class="carousel__description">
 *       <img class="techspec" ...> (optional)
 *       <div class="best-seller-container">...</div>
 *       <h3 class="carousel__title2">Product Name</h3>
 *       <span class="carousel__subtitle">Description</span>
 *     </div>
 *   </a>
 */
export default function parse(element, { document }) {
  // Each product card is an anchor element within the .row container
  const cards = element.querySelectorAll(':scope > a');
  const cells = [];

  cards.forEach((card) => {
    // Extract the product image
    // Live DOM: inside div.img-style; source.html: direct child img
    const productImage = card.querySelector('.img-style img, img.carousel__item__image')
      || card.querySelector('img:not(.techspec)');

    // Extract product name from h3
    const productName = card.querySelector('h3.carousel__title2, h3');

    // Extract short description
    // Live DOM: span.carousel__subtitle; source.html: span:not(.bestSeller)
    const description = card.querySelector('span.carousel__subtitle')
      || card.querySelector(':scope > span:not(.bestSeller)');

    // Build the link to the product page using the anchor href
    const href = card.getAttribute('href');

    // First cell: product image
    const imageCell = [];
    if (productImage) {
      imageCell.push(productImage);
    }

    // Second cell: product name + description + link to product page
    const contentCell = [];
    if (productName) {
      contentCell.push(productName);
    }
    if (description) {
      contentCell.push(description);
    }
    if (href) {
      const link = document.createElement('a');
      link.href = href;
      link.textContent = productName ? productName.textContent : 'View Product';
      contentCell.push(link);
    }

    cells.push([imageCell, contentCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-product', cells });
  element.replaceWith(block);
}

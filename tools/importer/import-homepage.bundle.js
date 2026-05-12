/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/cards-category.js
  function parse(element, { document }) {
    const cardLinks = element.querySelectorAll("a[href]");
    const cells = [];
    cardLinks.forEach((link) => {
      const img = link.querySelector("img");
      const heading = link.querySelector("h3");
      if (!heading) return;
      const imageCell = img ? [img] : [];
      const anchor = document.createElement("a");
      anchor.setAttribute("href", link.getAttribute("href"));
      anchor.textContent = heading.textContent.trim();
      const h3El = document.createElement("h3");
      h3El.append(anchor);
      const textCell = [h3El];
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-category", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-brand.js
  function parse2(element, { document }) {
    const anchor = element.querySelector("a[href]");
    const ctaHref = anchor ? anchor.getAttribute("href") : "/";
    const titleSpan = element.querySelector(".hpb1-txt > span:first-of-type, p > span:first-of-type");
    const ctaButton = element.querySelector("button, .btn-new, .btn-pill");
    const ctaText = ctaButton ? ctaButton.textContent.trim() : "Learn More";
    const heading = document.createElement("h1");
    if (titleSpan) {
      const clone = titleSpan.cloneNode(true);
      heading.innerHTML = clone.innerHTML;
    } else {
      heading.textContent = "THE FUTURE DEPENDS ON OPTICS";
    }
    const ctaLink = document.createElement("a");
    ctaLink.setAttribute("href", ctaHref);
    ctaLink.textContent = ctaText;
    const cells = [];
    const bgImage = element.querySelector("img");
    if (bgImage) {
      cells.push([bgImage.cloneNode(true)]);
    }
    cells.push([heading, ctaLink]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-brand", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-promo.js
  function parse3(element, { document }) {
    const link = element.querySelector("a");
    if (!link) {
      element.replaceWith(document.createDocumentFragment());
      return;
    }
    const titleEl = element.querySelector(".bannerheader-h1, .banner-title, h1, h2, h3");
    const subtitleEl = element.querySelector("p.brandText, p.banner-subtitle");
    const contentCell = document.createElement("div");
    if (titleEl) {
      const heading = document.createElement("strong");
      heading.textContent = titleEl.textContent.trim();
      contentCell.appendChild(heading);
      contentCell.appendChild(document.createElement("br"));
    }
    if (subtitleEl && subtitleEl.textContent.trim()) {
      const desc = document.createElement("p");
      desc.textContent = subtitleEl.textContent.trim();
      contentCell.appendChild(desc);
    }
    const cta = document.createElement("a");
    cta.href = link.getAttribute("href") || link.href;
    cta.textContent = titleEl ? titleEl.textContent.trim() : "Learn More";
    contentCell.appendChild(cta);
    const img = element.querySelector("img");
    let imageEl;
    if (img) {
      imageEl = img;
    } else {
      imageEl = document.createElement("img");
      imageEl.src = "/placeholder.png";
      imageEl.alt = titleEl ? titleEl.textContent.trim() : "Promo";
    }
    const cells = [
      [[imageEl], [contentCell]]
    ];
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-promo", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/hero-event.js
  function parse4(element, { document }) {
    const wrapperLink = element.tagName === "A" ? element : element.querySelector("a");
    const ctaHref = wrapperLink ? wrapperLink.getAttribute("href") : null;
    const webinarHeader = element.querySelector('#webinarHeader, [id*="webinar"], [style*="background-image"]');
    let bgImageUrl = null;
    if (webinarHeader) {
      const style = webinarHeader.getAttribute("style") || "";
      const match = style.match(/background-image\s*:\s*url\(['"]?([^'")\s]+)['"]?\)/i);
      if (match) {
        bgImageUrl = match[1];
      }
    }
    const badgeEl = element.querySelector('p.series, p[class*="series"], .series');
    const heading = element.querySelector('h1, h2, h3, [class*="title"]');
    const ctaButton = element.querySelector('button, a.button, .btn-other, [class*="btn"]');
    const ctaText = ctaButton ? ctaButton.textContent.trim() : "Learn More";
    const cells = [];
    if (bgImageUrl) {
      const img = document.createElement("img");
      img.src = bgImageUrl;
      img.alt = "";
      cells.push([img]);
    } else {
      const imgEl = element.querySelector("img");
      if (imgEl) {
        cells.push([imgEl]);
      }
    }
    const contentCell = [];
    if (badgeEl) {
      const badgePara = document.createElement("p");
      badgePara.innerHTML = badgeEl.innerHTML;
      contentCell.push(badgePara);
    }
    if (heading) {
      const h1 = document.createElement("h1");
      h1.textContent = heading.textContent.trim();
      contentCell.push(h1);
    }
    if (ctaHref) {
      const ctaLink = document.createElement("a");
      ctaLink.href = ctaHref;
      ctaLink.textContent = ctaText;
      contentCell.push(ctaLink);
    }
    if (contentCell.length > 0) {
      cells.push(contentCell);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-event", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-product.js
  function parse5(element, { document }) {
    const cards = element.querySelectorAll(":scope > a");
    const cells = [];
    cards.forEach((card) => {
      const productImage = card.querySelector(".img-style img, img.carousel__item__image") || card.querySelector("img:not(.techspec)");
      const productName = card.querySelector("h3.carousel__title2, h3");
      const description = card.querySelector("span.carousel__subtitle") || card.querySelector(":scope > span:not(.bestSeller)");
      const href = card.getAttribute("href");
      const imageCell = [];
      if (productImage) {
        imageCell.push(productImage);
      }
      const contentCell = [];
      if (productName) {
        contentCell.push(productName);
      }
      if (description) {
        contentCell.push(description);
      }
      if (href) {
        const link = document.createElement("a");
        link.href = href;
        link.textContent = productName ? productName.textContent : "View Product";
        contentCell.push(link);
      }
      cells.push([imageCell, contentCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-product", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-article.js
  function parse6(element, { document }) {
    const cards = element.querySelectorAll(".card-rc");
    const cells = [];
    cards.forEach((card) => {
      const image = card.querySelector("img");
      const trendingDiv = card.querySelector(".trending");
      const heading = card.querySelector("h2, h3");
      const contentCell = [];
      if (trendingDiv) {
        const contentTypeText = trendingDiv.textContent.trim();
        const p = document.createElement("p");
        p.textContent = contentTypeText;
        contentCell.push(p);
      }
      if (heading) contentCell.push(heading);
      cells.push([image || "", contentCell.length ? contentCell : ""]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-article", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-contact.js
  function parse7(element, { document }) {
    const columns = element.querySelectorAll(':scope > div[class*="col-"]');
    const cols = columns.length > 0 ? columns : element.querySelectorAll(":scope > div");
    const row = [];
    cols.forEach((col) => {
      const cellContent = [];
      const upperDiv = col.querySelector(".upper, .inlineBlock");
      if (upperDiv) {
        const children = upperDiv.childNodes;
        for (let i = 0; i < children.length; i++) {
          const node = children[i];
          if (node.nodeType !== 1) continue;
          if (node.tagName === "BR") continue;
          if (node.tagName === "SPAN") {
            const innerLink = node.querySelector("a[href]");
            if (innerLink && node.textContent.trim() === innerLink.textContent.trim()) {
              const a = document.createElement("a");
              a.href = innerLink.getAttribute("href");
              a.textContent = innerLink.textContent.trim();
              if (a.textContent) cellContent.push(a);
            } else if (innerLink) {
              const p = document.createElement("p");
              p.innerHTML = node.innerHTML;
              if (p.textContent.trim()) cellContent.push(p);
            } else {
              if (node.textContent.trim()) {
                const p = document.createElement("p");
                p.textContent = node.textContent.trim();
                cellContent.push(p);
              }
            }
          } else if (node.tagName === "A") {
            const a = document.createElement("a");
            a.href = node.getAttribute("href");
            a.textContent = node.textContent.trim();
            if (a.textContent) cellContent.push(a);
          } else {
            const links = node.querySelectorAll("a[href]");
            if (links.length > 0) {
              links.forEach((link) => {
                const a = document.createElement("a");
                a.href = link.getAttribute("href");
                a.textContent = link.textContent.trim();
                if (a.textContent) cellContent.push(a);
              });
            } else if (node.textContent.trim()) {
              const p = document.createElement("p");
              p.textContent = node.textContent.trim();
              cellContent.push(p);
            }
          }
        }
      } else {
        const button = col.querySelector("button");
        const link = col.querySelector("a[href]");
        if (button) {
          const p = document.createElement("p");
          p.textContent = button.textContent.trim();
          cellContent.push(p);
        }
        if (link) {
          const a = document.createElement("a");
          a.href = link.getAttribute("href");
          a.textContent = link.textContent.trim();
          if (a.textContent) cellContent.push(a);
        }
      }
      if (cellContent.length === 0) {
        const p = document.createElement("p");
        p.textContent = col.textContent.trim();
        if (p.textContent) cellContent.push(p);
      }
      row.push(cellContent);
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-contact", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/edmundoptics-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        "header",
        "footer.eoFooter"
      ]);
    }
  }

  // tools/importer/transformers/edmundoptics-sections.js
  var TransformHook2 = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  var FALLBACK_SELECTORS = {
    "section.banners": "#compartBanner"
  };
  function findSection(scope, selector) {
    let el = scope.querySelector(selector);
    if (el) return el;
    if (selector.startsWith("section.")) {
      el = scope.querySelector(selector.replace("section", ""));
      if (el) return el;
    }
    const fallback = FALLBACK_SELECTORS[selector];
    if (fallback) {
      el = scope.querySelector(fallback);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    if (hookName === TransformHook2.afterTransform) {
      const { template } = payload;
      if (!template || !template.sections || template.sections.length < 2) return;
      const document = element.ownerDocument;
      const sections = template.sections;
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const sectionEl = findSection(element, section.selector);
        if (!sectionEl) continue;
        if (section.style) {
          const metaBlock = WebImporter.Blocks.createBlock(document, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          sectionEl.append(metaBlock);
        }
        if (i > 0) {
          const hr = document.createElement("hr");
          sectionEl.before(hr);
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "cards-category": parse,
    "hero-brand": parse2,
    "cards-promo": parse3,
    "hero-event": parse4,
    "cards-product": parse5,
    "cards-article": parse6,
    "columns-contact": parse7
  };
  var transformers = [
    transform,
    transform2
  ];
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Edmund Optics homepage with hero, product categories, and promotional content",
    urls: ["https://www.edmundoptics.com/"],
    blocks: [
      {
        name: "cards-category",
        instances: [".shop-by-cat .row"]
      },
      {
        name: "hero-brand",
        instances: ["#bannerParent1"]
      },
      {
        name: "cards-promo",
        instances: ["#bannerParent2", "#bannerParent3"]
      },
      {
        name: "hero-event",
        instances: ["#bannerParent4"]
      },
      {
        name: "cards-product",
        instances: [".feat-prods .row"]
      },
      {
        name: "cards-article",
        instances: ["#dv-resources .row.respd:has(.card-rc)"]
      },
      {
        name: "columns-contact",
        instances: [".contactbanner_whitefooter .row"]
      }
    ],
    sections: [
      {
        id: "section-1",
        name: "Shop by Category",
        selector: ".shop-by-cat",
        style: null,
        blocks: ["cards-category"],
        defaultContent: [".shop-by-cat h2"]
      },
      {
        id: "section-2",
        name: "Hero Banners",
        selector: "section.banners",
        style: null,
        blocks: ["hero-brand", "cards-promo", "hero-event"],
        defaultContent: []
      },
      {
        id: "section-3",
        name: "Featured Products",
        selector: "section.feat-prods",
        style: null,
        blocks: ["cards-product"],
        defaultContent: ["section.feat-prods h2"]
      },
      {
        id: "section-4",
        name: "Knowledge Center",
        selector: "#dv-resources",
        style: null,
        blocks: ["cards-article"],
        defaultContent: ["#dv-resources .homepageh1", "#dv-resources h3", "#dv-resources .btn-other"]
      },
      {
        id: "section-5",
        name: "Contact Banner",
        selector: ".contactbanner_whitefooter",
        style: "dark",
        blocks: ["columns-contact"],
        defaultContent: []
      }
    ]
  };
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const { document, url, html, params } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();

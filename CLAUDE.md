# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Static demo site for ~60 Tishonator WordPress themes, deployed to Cloudflare Workers via Wrangler. Each theme's demo is a self-contained directory of pre-rendered static HTML (exported from WordPress) with local JS replacing WooCommerce AJAX, search, and chatbot functionality.

## Architecture

- **wrangler.jsonc** — Cloudflare Workers config. `assets.directory` is `"."` (repo root), so all theme directories are served (e.g., `/tgymm/`, `/alphana/`, `/tblogging/`).
- **Each theme directory** (e.g., `alphana/`, `tgymm/`, `tblogging/`) contains: static HTML pages (blog posts, product pages, shop, categories, etc.), an `assets/` folder with vendored JS/CSS/fonts/images, and a `static-demo.js` that provides client-side interactivity.
- **`<theme>/assets/static-demo.js`** — Core interactivity layer per theme: localStorage-based cart, local page-index search, form interception (contact, newsletter, comments, chatbot), and notification UI. This is the main custom JS to edit when changing demo behavior.
- **`<theme>/assets/demo1/tishonator-demo/`** — Vendored WordPress/WooCommerce assets (jQuery, WooCommerce JS/CSS/fonts). Static copies, not generated.
- **`<theme>/assets/external/`** — Vendored third-party assets (Google Fonts, Font Awesome, social sharing scripts).

## Commands

```bash
# Install wrangler (if not already installed)
npm install -g wrangler

# Local development server
npx wrangler dev

# Deploy to Cloudflare Workers
npx wrangler deploy
```

## Key Considerations

- HTML files are pre-rendered static exports — they contain inline CSS and hardcoded content. Bulk changes across pages require scripting or find-and-replace.
- The `static-demo.js` page index array must be manually updated when adding/removing pages.
- Asset filenames include content hashes (e.g., `jquery.min_f43b551b.js`). When replacing vendored assets, update all HTML references.
- All ~60 theme directories share identical structure but each has its own independent `static-demo.js` and HTML files. Changes to one theme do not propagate to others.

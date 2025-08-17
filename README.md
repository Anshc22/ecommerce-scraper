# Ecommerce Scraper

Dark-themed multi-store ecommerce deal aggregator MVP (Amazon.in, Flipkart, Meesho, Snapdeal, JioMart, PayTM Mall).

![Sample UI](./frontend/assets/sample-ui.png)

## About
This project scrapes product listings from multiple Indian ecommerce platforms and aggregates results for price comparison. It includes a Next.js frontend (in `frontend/`) and server-side scraping endpoints (in `backend/api/`) using Puppeteer.

## Usage
1. Install dependencies: `npm install`
2. Run in development: `npm run dev`

## Notes
- Puppeteer scraping may require additional setup to run in certain environments (Docker, CI, cloud).
- Respect target websites' robots.txt and terms of service.

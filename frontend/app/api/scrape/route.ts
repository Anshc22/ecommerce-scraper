import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const GOTO_TIMEOUT = 40000;

async function scrapeAmazon(term: string) {
  console.log(`🔍 Starting Amazon scrape for: "${term}"`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    console.log('✅ Amazon browser launched successfully');
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const url = `https://www.amazon.in/s?k=${encodeURIComponent(term)}`;
    console.log(`🌐 Amazon URL: ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: GOTO_TIMEOUT });
      console.log('✅ Amazon page loaded');
    } catch (err: any) {
      console.error('❌ Amazon page navigation error (timeout or blocked):', err.message);
      await browser.close();
      return [];
    }
    
    const results = await page.evaluate(() => {
      console.log('🔍 Evaluating Amazon page...');
      
      let items = [];
      const selectors = [
        '[data-component-type="s-search-result"]',
        '.s-result-item',
        '[data-asin]:not([data-asin=""])',
        '.puis-card-container'
      ];
      
      for (const selector of selectors) {
        items = Array.from(document.querySelectorAll(selector));
        console.log(`Selector "${selector}" found ${items.length} items`);
        if (items.length > 0) break;
      }
      
      if (items.length === 0) {
        console.log('❌ No items found with any selector');
        return [];
      }
      
      return items.slice(0, 10).map((item, index) => {
        console.log(`Processing Amazon item ${index + 1}`);
        
        let title = '';
        const titleSelectors = [
          'h2 a span',
          '[data-cy="title-recipe"] span',
          '.a-size-medium span',
          '.a-text-normal'
        ];
        
        for (const selector of titleSelectors) {
          const element = item.querySelector(selector);
          if (element?.textContent?.trim()) {
            title = element.textContent.trim();
            break;
          }
        }
        
        let link = '';
        const linkSelectors = ['h2 a', 'a[href*="/dp/"]', '.a-link-normal'];
        for (const selector of linkSelectors) {
          const element = item.querySelector(selector);
          if (element?.getAttribute('href')) {
            const href = element.getAttribute('href');
            link = href.startsWith('http') ? href : `https://www.amazon.in${href}`;
            break;
          }
        }
        
        let price = 'Price not available';
        const priceSelectors = [
          '.a-price .a-offscreen',
          '.a-price-whole',
          '[data-cy="price-recipe"] .a-price .a-offscreen'
        ];
        
        for (const selector of priceSelectors) {
          const element = item.querySelector(selector);
          if (element?.textContent?.trim()) {
            price = element.textContent.trim();
            if (selector === '.a-price-whole') {
              const fraction = item.querySelector('.a-price-fraction')?.textContent || '';
              price = `₹${price}${fraction}`;
            }
            break;
          }
        }
        
        let rating = 'N/A';
        const ratingSelectors = [
          '.a-icon-alt',
          'span[aria-hidden="true"]',
          '[data-cy="reviews-block"] span'
        ];
        
        for (const selector of ratingSelectors) {
          const element = item.querySelector(selector);
          if (element?.textContent) {
            const text = element.textContent.trim();
            const ratingMatch = text.match(/(\d+\.?\d*)/);
            if (ratingMatch && parseFloat(ratingMatch[1]) <= 5) {
              rating = ratingMatch[1];
              break;
            }
          }
        }
        
        const thumbnailElement = item.querySelector('img.s-image') || item.querySelector('img');
        const thumbnail = thumbnailElement?.getAttribute('src') || '';
        
        const result = {
          platform: 'Amazon.in',
          platformLogo: '🛒',
          productName: title,
          price: price,
          rating: rating,
          link: link,
          thumbnail: thumbnail,
          discount: null,
          availability: 'Available'
        };
        
        return result;
      }).filter(item => item.productName && item.link);
    });
    
    console.log(`✅ Amazon results: ${results.length} items found`);
    await browser.close();
    return results;
    
  } catch (error: any) {
    console.error('❌ Amazon scraping error:', error.message);
    if (browser) await browser.close();
    return [];
  }
}

async function scrapeFlipkart(term: string) {
  console.log(`🔍 Starting Flipkart scrape for: "${term}"`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const url = `https://www.flipkart.com/search?q=${encodeURIComponent(term)}`;
    console.log(`🌐 Flipkart URL: ${url}`);
    
    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: GOTO_TIMEOUT });
      console.log('✅ Flipkart page loaded');
    } catch (err: any) {
      console.error('❌ Flipkart page navigation error (timeout or blocked):', err.message);
      await browser.close();
      return [];
    }
    
    const results = await page.evaluate(() => {
      console.log('🔍 Evaluating Flipkart page...');
      
      const items = Array.from(document.querySelectorAll('[data-id]'));
      console.log(`Found ${items.length} Flipkart items`);
      
      return items.slice(0, 10).map((item, index) => {
        const titleElement = item.querySelector('.wjcEIp');
        const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';
        
        const linkElement = item.querySelector('.wjcEIp');
        const href = linkElement?.getAttribute('href') || '';
        const link = href ? `https://www.flipkart.com${href}` : '';
        
        const priceElement = item.querySelector('.Nx9bqj');
        const price = priceElement?.textContent?.trim() || 'Price not available';
        
        const ratingElement = item.querySelector('.XQDdHH');
        const ratingCountElement = item.querySelector('.Wphh3N');
        
        let rating = 'N/A';
        if (ratingElement && ratingCountElement) {
          const ratingValue = ratingElement.textContent?.trim() || '';
          const ratingCount = ratingCountElement.textContent?.trim().replace(/[()]/g, '') || '';
          rating = `${ratingValue} (${ratingCount})`;
        } else if (ratingElement) {
          rating = ratingElement.textContent?.trim() || 'N/A';
        }
        
        const thumbnailElement = item.querySelector('.DByuf4');
        const thumbnail = thumbnailElement?.getAttribute('src') || '';
        
        return {
          platform: 'Flipkart',
          platformLogo: '🛍️',
          productName: title,
          price: price,
          rating: rating,
          link: link,
          thumbnail: thumbnail,
          discount: null,
          availability: 'Available'
        };
      }).filter(item => item.productName && item.link);
    });
    
    console.log(`✅ Flipkart results: ${results.length} items found`);
    await browser.close();
    return results;
    
  } catch (error: any) {
    console.error('❌ Flipkart scraping error:', error.message);
    if (browser) await browser.close();
    return [];
  }
}

async function scrapeMeesho(term: string, page: number = 1) {
  console.log(`🔍 Starting Meesho scrape for: "${term}" (Page ${page})`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const browserPage = await browser.newPage();
    await browserPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const url = `https://www.meesho.com/search?q=${encodeURIComponent(term)}&page=${page}`;
    console.log(`🌐 Meesho URL: ${url}`);
    
    try {
      await browserPage.goto(url, { waitUntil: 'networkidle2', timeout: GOTO_TIMEOUT });
      console.log('✅ Meesho page loaded');
    } catch (err: any) {
      console.error('❌ Meesho page navigation error (timeout or blocked):', err.message);
      await browser.close();
      return [];
    }
    
    const results = await browserPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.ProductListItem__GridCol-sc-1baba2g-0'));
      console.log(`Found ${items.length} Meesho items`);
      
      return items.slice(0, 10).map((item, index) => {
        const titleElement = item.querySelector('.NewProductCardstyled__StyledDesktopProductTitle-sc-6y2tys-5') ||
                           item.querySelector('p[color="greyT2"]');
        const title = titleElement?.textContent?.trim() || '';
        
        const linkElement = item.querySelector('a[href]');
        const href = linkElement?.getAttribute('href') || '';
        const link = href ? `https://www.meesho.com${href}` : '';
        
        const priceElement = item.querySelector('h5[color="greyBase"]') ||
                           item.querySelector('.sc-eDvSVe.dwCrSh');
        const price = priceElement?.textContent?.trim() || 'Price not available';
        
        const ratingElement = item.querySelector('.Rating__StyledPill-sc-12htng8-1 span[color="#ffffff"]');
        const ratingCountElement = item.querySelector('.NewProductCardstyled__RatingCount-sc-6y2tys-22');
        
        let rating = 'N/A';
        if (ratingElement && ratingCountElement) {
          const ratingValue = ratingElement.textContent?.trim() || '';
          const ratingCount = ratingCountElement.textContent?.trim().replace(' Reviews', '') || '';
          rating = `${ratingValue} (${ratingCount})`;
        } else if (ratingElement) {
          rating = ratingElement.textContent?.trim() || 'N/A';
        }
        
        const thumbnailElement = item.querySelector('img[alt]');
        const thumbnail = thumbnailElement?.getAttribute('src') || '';
        
        return {
          platform: 'Meesho',
          platformLogo: '🛍️',
          productName: title,
          price: price,
          rating: rating,
          link: link,
          thumbnail: thumbnail,
          discount: null,
          availability: 'Available'
        };
      }).filter(item => item.productName && item.link);
    });
    
    console.log(`✅ Meesho results: ${results.length} items found`);
    await browser.close();
    return results;
    
  } catch (error: any) {
    console.error('❌ Meesho scraping error:', error.message);
    if (browser) await browser.close();
    return [];
  }
}

async function scrapeSnapdeal(term: string, page: number = 1) {
  console.log(`🔍 Starting Snapdeal scrape for: "${term}" (Page ${page})`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const browserPage = await browser.newPage();
    await browserPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const url = `https://www.snapdeal.com/search?keyword=${encodeURIComponent(term)}&noOfResults=20&page=${page}`;
    console.log(`🌐 Snapdeal URL: ${url}`);
    
    try {
      await browserPage.goto(url, { waitUntil: 'networkidle2', timeout: GOTO_TIMEOUT });
      console.log('✅ Snapdeal page loaded');
    } catch (err: any) {
      console.error('❌ Snapdeal page navigation error (timeout or blocked):', err.message);
      await browser.close();
      return [];
    }
    
    const results = await browserPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.product-tuple-listing'));
      console.log(`Found ${items.length} Snapdeal items`);
      
      return items.slice(0, 10).map((item, index) => {
        const titleElement = item.querySelector('.product-title');
        const title = titleElement?.textContent?.trim() || titleElement?.getAttribute('title')?.trim() || '';
        
        const linkElement = item.querySelector('.dp-widget-link');
        const href = linkElement?.getAttribute('href') || '';
        const link = href || '';
        
        const priceElement = item.querySelector('.product-price');
        const price = priceElement?.textContent?.trim() || 'Price not available';
        
        let rating = 'N/A';
        const filledStars = item.querySelector('.filled-stars') as HTMLElement | null;
        const ratingCountElement = item.querySelector('.product-rating-count');
        
        if (filledStars && ratingCountElement) {
          const widthPercent = filledStars.style.width?.replace('%', '');
          if (widthPercent) {
            const ratingValue = (parseFloat(widthPercent) / 20).toFixed(1);
            const ratingCount = ratingCountElement.textContent?.trim().replace(/[()]/g, '') || '';
            rating = `${ratingValue} (${ratingCount})`;
          }
        } else if (filledStars) {
          const widthPercent = (filledStars as HTMLElement).style.width?.replace('%', '');
          if (widthPercent) {
            const ratingValue = (parseFloat(widthPercent) / 20).toFixed(1);
            rating = ratingValue;
          }
        }
        
        let thumbnail = '';
        const thumbnailElement = item.querySelector('.product-tuple-image img') || 
                                item.querySelector('img.product-image') ||
                                item.querySelector('picture img');
        
        if (thumbnailElement) {
          thumbnail = thumbnailElement.getAttribute('src') || 
                     thumbnailElement.getAttribute('data-src') || 
                     thumbnailElement.getAttribute('srcset')?.split(' ')[0] || '';
        }
        
        return {
          platform: 'Snapdeal',
          platformLogo: '🛒',
          productName: title,
          price: price,
          rating: rating,
          link: link,
          thumbnail: thumbnail,
          discount: null,
          availability: 'Available'
        };
      }).filter(item => item.productName && item.link);
    });
    
    console.log(`✅ Snapdeal results: ${results.length} items found`);
    await browser.close();
    return results;
    
  } catch (error: any) {
    console.error('❌ Snapdeal scraping error:', error.message);
    if (browser) await browser.close();
    return [];
  }
}

async function scrapeJioMartProductRating(productUrl: string, browser: any) {
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 10000 });
    
    const ratingInfo = await page.evaluate(() => {
      const averageRatingElement = document.querySelector('#average');
      const ratingValue = averageRatingElement?.textContent?.trim() || 'N/A';
      
      const totalRatingElement = document.querySelector('#total_rating');
      const reviewCount = totalRatingElement?.textContent?.trim() || '0';
      
      return {
        rating: ratingValue,
        reviewCount: reviewCount
      };
    });
    
    await page.close();
    return ratingInfo;
    
  } catch (error: any) {
    console.error(`❌ Error fetching rating from ${productUrl}:`, error.message);
    return { rating: 'N/A', reviewCount: '0' };
  }
}

async function scrapeJioMart(term: string, page: number = 1) {
  console.log(`🔍 Starting JioMart scrape for: "${term}" (Page ${page})`);
  
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const browserPage = await browser.newPage();
    await browserPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    const url = `https://www.jiomart.com/search/${encodeURIComponent(term)}`;
    console.log(`🌐 JioMart URL: ${url}`);
    
    try {
      await browserPage.goto(url, { waitUntil: 'networkidle2', timeout: GOTO_TIMEOUT });
      console.log('✅ JioMart page loaded');
    } catch (err: any) {
      console.error('❌ JioMart page navigation error (timeout or blocked):', err.message);
      await browser.close();
      return [];
    }
    
    const basicResults = await browserPage.evaluate(() => {
      const items = Array.from(document.querySelectorAll('.ais-InfiniteHits-item, .plp-card-wrapper'));
      
      return items.slice(0, 10).map((item, index) => {
        const titleElement = item.querySelector('.plp-card-details-name') || 
                           item.querySelector('a[title]');
        const title = titleElement?.textContent?.trim() || 
                     titleElement?.getAttribute('title')?.trim() || '';
        
        const linkElement = item.querySelector('a[href]');
        const href = linkElement?.getAttribute('href') || '';
        const link = href.startsWith('http') ? href : `https://www.jiomart.com${href}`;
        
        let price = 'Price not available';
        const priceElement = item.querySelector('.plp-card-details-price .jm-heading-xxs');
        if (priceElement) {
          price = priceElement.textContent?.trim() || 'Price not available';
        }
        
        let discount = null;
        const discountElement = item.querySelector('.jm-badge');
        if (discountElement) {
          discount = discountElement.textContent?.trim() || null;
        }
        
        let thumbnail = '';
        const thumbnailElement = item.querySelector('.plp-card-image img') || 
                                item.querySelector('img[alt]');
        
        if (thumbnailElement) {
          thumbnail = thumbnailElement.getAttribute('src') || 
                     thumbnailElement.getAttribute('data-src') || '';
        }
        
        return {
          platform: 'JioMart',
          platformLogo: '🛒',
          productName: title,
          price: price,
          rating: 'N/A',
          link: link,
          thumbnail: thumbnail,
          discount: discount,
          availability: 'Available'
        };
      }).filter(item => item.productName && item.link);
    });
    
    const resultsWithRatings = await Promise.all(
      basicResults.map(async (product) => {
        if (product.link && product.link.includes('jiomart.com')) {
          const ratingInfo = await scrapeJioMartProductRating(product.link, browser);
          
          const finalRating = ratingInfo.rating !== 'N/A' && ratingInfo.reviewCount !== '0'
            ? `${ratingInfo.rating} (${ratingInfo.reviewCount})`
            : ratingInfo.rating;
          
          return {
            ...product,
            rating: finalRating
          };
        }
        return product;
      })
    );
    
    await browserPage.close();
    console.log(`✅ JioMart results: ${resultsWithRatings.length} items found with ratings`);
    await browser.close();
    return resultsWithRatings;
    
  } catch (error: any) {
    console.error('❌ JioMart scraping error:', error.message);
    if (browser) await browser.close();
    return [];
  }
}

// 🔥 FIXED: PayTM Mall scraping function with corrected URL
async function scrapePaytmMall(term: string, page: number = 1) {
  console.log(`🔍 Starting PayTM Mall scrape for: "${term}" (Page ${page})`);
  
  let browser;
  let rawHtml = '';
  
  try {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
    });
    
    const browserPage = await browser.newPage();
    await browserPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // 🔥 FIXED: Changed URL from /search to /shop/search based on schema markup
    const url = `https://paytmmall.com/shop/search?q=${encodeURIComponent(term)}`;
    console.log(`🌐 PayTM Mall URL (FIXED): ${url}`);
    
    try {
      await browserPage.goto(url, { waitUntil: 'networkidle2', timeout: GOTO_TIMEOUT });
      console.log('✅ PayTM Mall page loaded');
      
      // Capture raw HTML for debugging
      rawHtml = await browserPage.content();
    //   console.log(`📄 PayTM Mall page content length: ${rawHtml.length} characters`);
      
      // Check page title to see if we reached the right page
      const pageTitle = await browserPage.title();
    //   console.log(`📖 PayTM Mall page title: "${pageTitle}"`);
      
      // Save HTML to file for inspection
    //   fs.writeFileSync('paytm-debug.html', rawHtml);
    //   console.log('💾 PayTM Mall HTML saved as paytm-debug.html');
      
    } catch (err: any) {
      console.error('❌ PayTM Mall page navigation error (timeout or blocked):', err.message);
      await browser.close();
      return { results: [], rawHtml: err.message };
    }
    
    const results = await browserPage.evaluate(() => {
      console.log('🔍 Evaluating PayTM Mall page...');
      
      // Try multiple selectors since the page structure might be different
      let items = [];
      const selectors = [
        '._3WhJ',  // Original selector
        '[data-testid="product-item"]',  // Common e-commerce selector
        '.product-item',
        '.product-card',
        '[class*="product"]'
      ];
      
      for (const selector of selectors) {
        items = Array.from(document.querySelectorAll(selector));
        console.log(`PayTM Mall selector "${selector}" found ${items.length} items`);
        if (items.length > 0) break;
      }
      
      if (items.length === 0) {
        console.log('❌ No PayTM Mall items found with any selector');
        return [];
      }
      
      return items.slice(0, 10).map((item, index) => {
        console.log(`Processing PayTM Mall item ${index + 1}`);
        
        // Title - try multiple selectors
        let title = '';
        const titleSelectors = [
          '.UGUy',      // Original selector
          'h3',         // Common title selector
          '.product-title',
          '.item-title',
          '[data-testid="product-title"]'
        ];
        
        for (const selector of titleSelectors) {
          const element = item.querySelector(selector);
          if (element?.textContent?.trim()) {
            title = element.textContent.trim();
            console.log(`Found title with selector "${selector}": ${title}`);
            break;
          }
        }
        
        // Link - try multiple selectors
        let link = '';
        const linkSelectors = [
          'a[href]',
          '.product-link'
        ];
        
        for (const selector of linkSelectors) {
          const element = item.querySelector(selector);
          if (element?.getAttribute('href')) {
            const href = element.getAttribute('href');
            link = href.startsWith('http') ? href : `https://paytmmall.com${href}`;
            console.log(`Found link with selector "${selector}": ${link}`);
            break;
          }
        }
        
        // Price - try multiple selectors
        let price = 'Price not available';
        const priceSelectors = [
          '._1kMS span',  // Original selector
          '.price',
          '.product-price',
          '[data-testid="price"]',
          '.current-price'
        ];
        
        for (const selector of priceSelectors) {
          const element = item.querySelector(selector);
          if (element?.textContent?.trim()) {
            const priceText = element.textContent.trim();
            const priceMatch = priceText.match(/(\d+)/);
            if (priceMatch) {
              price = `₹${priceMatch[1]}`;
              console.log(`Found price with selector "${selector}": ${price}`);
              break;
            }
          }
        }
        
        // Discount - try multiple selectors
        let discount = null;
        const discountSelectors = [
          '.c-ax',        // Original selector
          '.discount',
          '.offer',
          '.sale-price'
        ];
        
        for (const selector of discountSelectors) {
          const element = item.querySelector(selector);
          if (element?.textContent?.trim()) {
            discount = element.textContent.trim();
            console.log(`Found discount with selector "${selector}": ${discount}`);
            break;
          }
        }
        
        // Thumbnail - try multiple selectors
        let thumbnail = '';
        const thumbnailSelectors = [
          'img[alt]',     // Original selector
          'img',
          '.product-image img',
          '[data-testid="product-image"]'
        ];
        
        for (const selector of thumbnailSelectors) {
          const element = item.querySelector(selector);
          if (element?.getAttribute('src')) {
            thumbnail = element.getAttribute('src');
            console.log(`Found thumbnail with selector "${selector}": ${thumbnail}`);
            break;
          }
        }
        
        const result = {
          platform: 'PayTM Mall',
          platformLogo: '💳',
          productName: title,
          price: price,
          rating: 'N/A',
          link: link,
          thumbnail: thumbnail,
          discount: discount,
          availability: 'Available'
        };
        
        console.log(`PayTM Mall Item ${index + 1}:`, JSON.stringify(result, null, 2));
        return result;
      }).filter(item => item.productName && item.link);
    });
    
    console.log(`✅ PayTM Mall results: ${results.length} items found`);
    await browser.close();
    return { results, rawHtml };
    
  } catch (error: any) {
    console.error('❌ PayTM Mall scraping error:', error.message);
    if (browser) await browser.close();
    return { results: [], rawHtml: error.message };
  }
}

export async function GET(request: NextRequest) {
  console.log('🚀 API /scrape called');
  
  try {
    const url = new URL(request.url);
    const term = url.searchParams.get('term');
    const page = parseInt(url.searchParams.get('page') || '1');
    
    if (!term) {
      console.log('❌ No search term provided');
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }
    
    console.log(`🔍 Search term: "${term}" (Page ${page})`);
    
    const startTime = Date.now();
    
    const [amazonResults, flipkartResults, meeshoResults, snapdealResults, jiomartResults, paytmData] = await Promise.all([
      scrapeAmazon(term),
      scrapeFlipkart(term),
      scrapeMeesho(term, page),
      scrapeSnapdeal(term, page),
      scrapeJioMart(term, page),
      scrapePaytmMall(term, page)
    ]);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const combinedResults = [
      ...amazonResults, 
      ...flipkartResults, 
      ...meeshoResults, 
      ...snapdealResults, 
      ...jiomartResults, 
      ...(paytmData.results || [])
    ];
    
    console.log(`✅ Scraping completed in ${duration}ms`);
    console.log(`📊 Amazon: ${amazonResults.length} results`);
    console.log(`📊 Flipkart: ${flipkartResults.length} results`);
    console.log(`📊 Meesho: ${meeshoResults.length} results`);
    console.log(`📊 Snapdeal: ${snapdealResults.length} results`);
    console.log(`📊 JioMart: ${jiomartResults.length} results`);
    console.log(`📊 PayTM Mall: ${paytmData.results?.length || 0} results`);
    console.log(`📊 Total: ${combinedResults.length} results`);
    
    return NextResponse.json({ 
      results: combinedResults,
      paytmRawHtml: paytmData.rawHtml, // Only PayTM Mall debug output
      meta: {
        searchTerm: term,
        duration,
        page,
        amazonCount: amazonResults.length,
        flipkartCount: flipkartResults.length,
        meeshoCount: meeshoResults.length,
        snapdealCount: snapdealResults.length,
        jiomartCount: jiomartResults.length,
        paytmCount: paytmData.results?.length || 0,
        total: combinedResults.length,
        totalPages: Math.max(1, Math.ceil(combinedResults.length / 30))
      }
    });
    
  } catch (error: any) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}

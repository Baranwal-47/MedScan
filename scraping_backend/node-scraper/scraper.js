// scraper.js

const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// MongoDB setup
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.MONGO_DB_NAME || 'prescription-medicine';
const COLLECTION = 'medicines';

// Sleep helper
const sleep = ms => new Promise(res => setTimeout(res, ms));

// Function to get random pages between 1 and 300
const getRandomPages = (count = 3, min = 301, max = 330) => {
  const pages = new Set();
  while (pages.size < count) {
    pages.add(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return Array.from(pages);
};

async function scrape() {
  // Connect to MongoDB
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const col = db.collection(COLLECTION);

  // Launch headless browser
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();

  // All letters a-z
  const letters = 'cdefghijklmnopqrstuvwxyz'.split('');

  for (const letter of letters) {
    console.log(`\n=== Processing medicines starting with letter: ${letter.toUpperCase()} ===`);
    
    // Get 3 random pages for this letter
    const randomPages = getRandomPages(3, 301, 330);

    console.log(`Random pages for letter ${letter}: ${randomPages.join(', ')}`);

    for (const pageNum of randomPages) {
      // Construct URL based on letter
      let listUrl;
      if (letter === 'a') {
        listUrl = `https://www.1mg.com/drugs-all-medicines?page=${pageNum}`;
      } else {
        listUrl = `https://www.1mg.com/drugs-all-medicines?label=${letter}&page=${pageNum}`;
      }

      console.log(`Loading list page: ${listUrl}`);
      
      try {
        await page.goto(listUrl, { waitUntil: 'networkidle2', timeout: 30000 });
        await sleep(2000);

        // Extract product links and names from list page
        const items = await page.$$eval(
          'div[class^="style__product-card"] a[href^="/drugs/"]',
          els => els.map(a => ({
            link: 'https://www.1mg.com' + a.getAttribute('href'),
            name: a.querySelector('div')?.innerText.trim() || ''
          }))
        );

        console.log(`Found ${items.length} medicines on page ${pageNum} for letter ${letter}`);

        // If no items found, skip to next page
        if (items.length === 0) {
          console.log(`No medicines found on page ${pageNum} for letter ${letter}, skipping...`);
          continue;
        }

        for (const med of items) {
          console.log(`Processing detail page: ${med.name}`);
          
          try {
            await page.goto(med.link, { waitUntil: 'networkidle2', timeout: 30000 });
            await sleep(3000);

            // Extract detail fields with multiple fallback selectors
            const detail = await page.evaluate(() => {
              // Helper function to find text by multiple selectors
              const findTextBySelectors = (selectors) => {
                for (const selector of selectors) {
                  const el = document.querySelector(selector);
                  if (el && el.innerText.trim()) {
                    return el.innerText.trim();
                  }
                }
                return '';
              };

              // Helper to find manufacturer
              const findManufacturer = () => {
                const labels = ['Marketer', 'MARKETER', 'Manufacturer', 'MANUFACTURER'];
                for (const label of labels) {
                  const labelEl = Array.from(document.querySelectorAll('*')).find(el => 
                    el.innerText && el.innerText.trim() === label
                  );
                  if (labelEl) {
                    const parent = labelEl.parentElement;
                    const nextSibling = labelEl.nextElementSibling;
                    const valueEl = parent?.querySelector('a') || nextSibling?.querySelector('a') || nextSibling;
                    if (valueEl && valueEl.innerText.trim()) {
                      return valueEl.innerText.trim();
                    }
                  }
                }
                
                const manufacturerPatterns = /Pvt Ltd|Ltd|Laboratories|Pharma|Industries/i;
                const allDivs = document.querySelectorAll('div');
                for (const div of allDivs) {
                  const text = div.innerText.trim();
                  if (text && manufacturerPatterns.test(text) && text.length < 100) {
                    return text;
                  }
                }
                return '';
              };

              // Name
              const name = findTextBySelectors([
                '.DrugHeader__title-content___2ZaPo',
                'h1[itemprop="name"]',
                'h1',
                '.drug-header h1'
              ]);

              // Manufacturer
              const manufacturer = findManufacturer();

              // Image URL
              let image_url = '';
              const imgSelectors = [
                '.card-slide img',
                '.drug-image img',
                '.product-image img',
                'img[alt*="Injection"]',
                'img[alt*="Capsule"]',
                'img[alt*="Tablet"]'
              ];
              for (const selector of imgSelectors) {
                const img = document.querySelector(selector);
                if (img && img.src) {
                  image_url = img.src;
                  break;
                }
              }

              // Description
              let description = '';
              const headings = document.querySelectorAll('h2, h3');
              for (const heading of headings) {
                if (heading.innerText.includes('Product introduction') || 
                    heading.innerText.includes('PRODUCT INTRODUCTION')) {
                  const nextEl = heading.nextElementSibling;
                  if (nextEl && nextEl.innerText.trim()) {
                    description = nextEl.innerText.trim().replace(/\s{2,}/g, ' ');
                    break;
                  }
                }
              }

              // Uses
              let uses = '';
              for (const heading of headings) {
                if (heading.innerText.includes('Uses of') || heading.innerText.includes('USES OF')) {
                  const container = heading.parentElement;
                  const items = container.querySelectorAll('ul li, ol li');
                  if (items.length > 0) {
                    uses = Array.from(items).map(li => li.innerText.trim()).join(', ');
                    break;
                  }
                }
              }

              // Side effects
              let side_effects = '';
              for (const heading of headings) {
                if (heading.innerText.includes('Side effects') || 
                    heading.innerText.includes('SIDE EFFECTS') ||
                    heading.innerText.includes('Common side effects')) {
                  const container = heading.parentElement;
                  const items = container.querySelectorAll('ul li, ol li');
                  if (items.length > 0) {
                    side_effects = Array.from(items).map(li => li.innerText.trim()).join(', ');
                    break;
                  }
                }
              }

              // Composition
              let composition = '';
              const compositionLabels = ['SALT COMPOSITION', 'Composition', 'Active ingredients'];
              for (const label of compositionLabels) {
                const labelEl = Array.from(document.querySelectorAll('*')).find(el => 
                  el.innerText && el.innerText.trim() === label
                );
                if (labelEl) {
                  const parent = labelEl.parentElement;
                  const valueEl = parent?.querySelector('a') || labelEl.nextElementSibling;
                  if (valueEl && valueEl.innerText.trim()) {
                    composition = valueEl.innerText.trim();
                    break;
                  }
                }
              }

              // Quick tips
              let quick_tips = '';
              const tipsSection = document.getElementById('expert_advice');
              if (tipsSection) {
                const items = tipsSection.querySelectorAll('ul li, ol li');
                quick_tips = Array.from(items).map(li => '- ' + li.innerText.trim()).join('\n');
              }

              // Price
              const price = findTextBySelectors([
                '.DrugPriceBox__best-price___32JXw',
                '.best-price',
                '.final-price'
              ]);

              return {
                name,
                manufacturer,
                image_url,
                description,
                uses,
                side_effects,
                composition,
                quick_tips,
                price
              };
            });

            // Build document
            const doc = {
              name: detail.name || med.name,
              link: med.link,
              letter: letter.toUpperCase(), // Add letter field for categorization
              manufacturer: detail.manufacturer,
              image_url: detail.image_url,
              description: detail.description,
              uses: detail.uses,
              side_effects: detail.side_effects,
              composition: detail.composition,
              quick_tips: detail.quick_tips,
              price: detail.price,
              scraped_at: new Date() // Add timestamp
            };

            try {
              await col.insertOne(doc);
              console.log(`✓ Inserted: ${doc.name}`);
            } catch (err) {
              console.error(`✗ Insert error for ${doc.name}:`, err.message);
            }

            await sleep(2000); // Delay between medicine pages

          } catch (error) {
            console.error(`Error processing medicine ${med.name}:`, error.message);
            continue; // Skip to next medicine
          }
        }

        console.log(`✓ Completed page ${pageNum} for letter ${letter}`);
        await sleep(3000); // Delay between pages

      } catch (error) {
        console.error(`Error loading page ${pageNum} for letter ${letter}:`, error.message);
        continue; // Skip to next page
      }
    }

    console.log(`✓ Completed all pages for letter ${letter.toUpperCase()}`);
    await sleep(5000); // Longer delay between letters
  }

  await browser.close();
  await client.close();
  console.log('\n🎉 Scraping completed for all letters!');
  
  // Print summary
  const totalCount = await col.countDocuments();
  console.log(`Total medicines scraped: ${totalCount}`);
}

scrape().catch(err => {
  console.error('Scraper error:', err);
  process.exit(1);
});

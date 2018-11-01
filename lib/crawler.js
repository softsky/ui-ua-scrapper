const P = require('puppeteer'),
      fs = require('fs'),
      _ = require('lodash');

const logger = require('../utils/logger');
let browser;

const crawlGoogleResults = async (url, b) => {
  browser = browser || b || await P.launch({
    //headless: false,
    headless: true,
    // slowMo: 0
  });

  let objects = [];
  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: ['domcontentloaded', 'networkidle2'],
  });

  const evalPromise = page.evaluate(() => {
    const el = (sel, doc) => doc?doc.querySelector(sel):document.querySelector(sel),
          els = (sel, doc) => doc?doc.querySelectorAll(sel):document.querySelectorAll(sel),
          n2a = (el) => Array.prototype.slice.call(el);

    return n2a(els('.srg .g .rc'))
      .map((it) => {
        return {
          link: el('.r a', it).href,
          title: el('.r a h3', it).textContent,
          desc: el('.s .st', it).textContent,
        };
      });
  });

  do {
    const new_objects = await evalPromise;

    logger.info(`New objects: ${new_objects.length}`);
    objects = objects.concat(new_objects);

    // url += new_objects.map((it) => {
    //   logger.info(it.link);
    //   return ' -inurl:' + /https?:\/\/([^/]*)\//.exec(it.link)[1];
    // });

    // logger.info(`NewLink:${url}`);

    try {
      await page.waitForSelector('#pnnext', 3600000);
      await page.click('#pnnext');
    }catch(e){
      // no a.pn found, breaking the loop
      break;
    }
  } while(true); /* eslint no-constant-condition: 1 */

  logger.info(`Objects been crawled: ${objects.length}`);
  //  logger.info(JSON.stringify(objects));
  return objects;
},
      crawlCompany = async (url, b) => {
        process.setMaxListeners(0);
        browser = browser || b || await P.launch({
          //headless: false,
          headless: true,
          // slowMo: 0
        });

        // browser = await P.launch({
        //   //headless: false,
        //   headless: true,
        //   // slowMo: 0
        // });

        logger.info(`Opening url: ${url}`);
        //const page = (await browser.pages())[0];
        const page = await browser.newPage();

        let companyCard = { url: new URL(url).hostname };

        const resp = await page.goto(url, {
          //waitUntil: ['domcontentloaded', 'networkidle2'],
        });

        if(resp.status() === 200)
          try {
            //        fs.createWriteStream(`pages/${/file|https?:\/\/([^/]*)\//.exec(url)[1]}`)
            //          .write(await page.content());
            companyCard = _.merge(companyCard, await page.evaluate(() => {
              const el = (sel, doc) => doc?doc.querySelector(sel):document.querySelector(sel),
                    n2a = (el) => el?Array.prototype.slice.call(el):[];

              const uc = el('.c-page .panel-body .c-user-content'),
                    cc = {
                      banner: el('#CompanyBanner')?el('#CompanyBanner').src:null,
                      title: document.title,
                      text: n2a(uc.childNodes).map((it) => it.textContent),
                    };
              return cc;
            }));

            await page.click('a[href$="/contacts"]');
            await page.waitForSelector('.c-fake-phone', { timeout: 2000 });
            await page.click('.c-fake-phone');
            await page.waitForSelector('.c-actual-phone');

            companyCard = _.merge(companyCard, await page.evaluate(() => {
              const el = (sel, doc) => doc?doc.querySelector(sel):document.querySelector(sel),
                    txt = (sel) => el(sel)?el(sel).textContent:null;

              return {
                name: txt('td[property="name"]'),
                phone: txt('.c-actual-phone').split(', '),
                address: txt('td[property="streetAddress"]'),
                email: txt('td[property="email"]'),
              };

            }));

            logger.info(`Closing url: ${url}`);
            page.close();
          } catch(e) {
            // something wrong happened
            logger.error(`Error: ${JSON.stringify(e)}`);
            companyCard.error = JSON.stringify(e);
          } else {
            companyCard.response = { status: resp.status() };
          }
        return companyCard;
      },

      crawlCompanies = async (array, b, numSeries) => {
        process.setMaxListeners(0);
        const companies = [];
        numSeries = numSeries || 10;
        const async_queue = Array(array.length).fill(async () => companies.push(await crawlCompany(array.pop(), b)));

        const results = await new Promise((resolve) => require('async')
                                          .parallelLimit(async_queue, numSeries, (err, results) => resolve(results)));

        logger.info(`Resulted array size: ${array.length}, async_queue size: ${async_queue.length}`);
        logger.info(results);
        return companies;
      },

      crawl = async (companies, b) => {
        companies
          .map(async (company) => {
            const data = await crawlCompany(company.url, b);
            //await storeCompany(data);
            return _.merge(data, company);
          });

        return Promise.resolve(true);
      };

// to prevent from that warning:
// (node:32236) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 Symbol(Connection.Events.Disconnected) listeners added. Use emitter.setMaxListeners() to increase limit

logger.info('Executing setMaxListeners(0)');
process.setMaxListeners(0);

module.exports = { crawl, crawlGoogleResults, crawlCompany, crawlCompanies };

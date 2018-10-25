const P = require('puppeteer'),
      _ = require('lodash');

const logger = require('../utils/logger');
let browser;

let crawlGoogleResults = async (url,b) => {
    browser = browser || b || await P.launch({
	//headless: false,
        headless: true,
	// slowMo: 0
    });



    let objects = [];
    do {
        const page = await browser.newPage();
        await page.goto(url, {
            waitUntil: ['domcontentloaded', 'networkidle2'],
        });

        let new_objects = await page.evaluate(() => {
            const el = (sel, doc) => doc?doc.querySelector(sel):document.querySelector(sel),
                  els = (sel, doc) => doc?doc.querySelectorAll(sel):document.querySelectorAll(sel),
                  txt = (sel) => el(sel).textContent,
                  xp = (xpathExpression, contextNode, namespaceResolver, resultType, result) => document.evaluate(
                      xpathExpression,
                      contextNode,
                      namespaceResolver,
                      resultType,
                      result),
                  n2a = (el) => Array.prototype.slice.call(el);

            return n2a(els('.srg .g .rc'))
                .map((it) => {
                    return {
                        link: el('.r a', it).href,
                        title: el('.r a h3', it).textContent,
                        desc: el('.s .st', it).textContent
                    }
                });
        });

        logger.info(new_objects.length)
        objects = objects.concat(new_objects);


        url += new_objects.map((it) => {
            logger.info(it.link);
            return "+-inurl%3A" + /https?:\/\/([^\/]*)\//.exec(it.link)[1]
        });

        logger.info(`NewLink:${url}`);

        if(new_objects.length === 0)
            break;
    } while(true);

    logger.info(`Objects been crawled: ${objects.length}`);
    logger.info(JSON.stringify(objects));
    return objects;
},
    crawlCompany = async (url, b) => {
    browser = browser || b || await P.launch({
	//headless: false,
        headless: true,
	// slowMo: 0
    });

    //const page = (await browser.pages())[0];
    const page = await browser.newPage();
    await page.goto(url, {
        waitUntil: ['domcontentloaded', 'networkidle2'],
    });

    await page.click(".c-fake-phone");
    page.waitForSelector(".c-actual-phone");
    let companyCard = await page.evaluate(() => {
        const el = (sel, doc) => doc?doc.querySelector(sel):document.querySelector(sel),
              txt = (sel) => el(sel).textContent,
              xp = (xpathExpression, contextNode, namespaceResolver, resultType, result) => document.evaluate(
                  xpathExpression,
                  contextNode,
                  namespaceResolver,
                  resultType,
                  result),
              n2a = (el) => Array.prototype.slice.call(el);

        let uc = el(".c-page .panel-body .c-user-content"),
            cc = {
                phone: txt(".c-block-contacts .c-actual-phone").split(", "),
                address: txt(".c-block-contacts p"),
                banner: el("#CompanyBanner").src,
                title: document.title,
                text: n2a(uc.childNodes).map((it) => it.textContent)
            };
        cc.text.push(uc.textContent);
        console.log(cc);
        return cc;
    });

    logger.info(JSON.stringify(companyCard));
    //companyCard.text.push(uc.textContent);

    return companyCard;
},

    crawl = async (companies, b) => {
        companies
            .map(async (company) => {
                let data = await crawlCompany(company.url, b);
                //await storeCompany(data);
                return _.merge(data, company);
            });

        return Promise.resolve(true);
    }

module.exports = { crawl, crawlGoogleResults, crawlCompany }

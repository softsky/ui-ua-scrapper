const P = require('puppeteer'),
      r = require('request'),
      _ = require('lodash'),
      {db, collection, username, password, apiKey} = require(`./db-${process.env.NODE_ENV}.json`),
      digestRequest = require('request-digest')(username, apiKey);

const logger = require('./utils/logger');
let browser, mongo, mongoClient;

let crawlCompany = async (url, b) => {
    browser = browser || b || await P.launch({
	//headless: false,
        headless: true,
	// slowMo: 0
    });

    const page = (await browser.pages())[0];
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
    storeCompany = async (company, m) => {
        mongo = mongo || mongoClient || require('mongodb').MongoClient;

        var uri = `mongodb+srv://${username}:${password}@cluster0-l3ior.mongodb.net`;
        mongo.connect(
            uri, {
                ssl: true,
                useNewUrlParser: true
            })
            .catch((e) => logger.error(e))
            .then((client) => {
                mongoClient = client;
                const c = mongoClient.db(db).collection(collection)
                let ret;
                if(typeof company === 'array')
                    ret = c.insertMany(company)
                else
                    ret = c.insertOne(company);
                return ret;
            })
        return m;
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

module.exports = { crawl, crawlCompany, storeCompany }

// DoIt!
//crawl();



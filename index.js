const { crawl, crawlGoogleResults, crawlCompany } = require("./lib/crawler.js"),
      { storeCompany } = require("./lib/storer.js");

module.exports = { crawl, crawlGoogleResults, crawlCompany, storeCompany }

// DoIt!
//crawl();



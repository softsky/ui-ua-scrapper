const { crawl, crawlGoogleResults, crawlCompany, crawlCompanies } = require('./lib/crawler.js'),
  { storeCompany } = require('./lib/storer.js');

module.exports = { crawl, crawlGoogleResults, crawlCompany, crawlCompanies, storeCompany };

// DoIt!
// crawl();

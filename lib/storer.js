let mongo, mongoClient;

const { db, collection, username, password, host } = require(`../db-${process.env.NODE_ENV || 'test'}.json`);

/**
 * Stores received company object into MongoDB Atlas cluster.
 * @param {company} company object.
 * @param {m} instance to MongoDB client. If undefined, triest to initialize it
 * using ${username} and ${password} and ${host} variables
 */

const storeCompany = async (company, m) => {
  mongo = mongo || mongoClient || require('mongodb').MongoClient;

  var uri = `mongodb+srv://${username}:${password}@${host}`;
  mongo.connect(
    uri, {
      ssl: true,
      useNewUrlParser: true,
    })
    .catch((e) => logger.error(e))
    .then((client) => {
      mongoClient = client;
      const c = mongoClient.db(db).collection(collection);
      let ret;
      if(company.length !== undefined)
        ret = c.insertMany(company);
      else
        ret = c.insertOne(company);
      return ret;
    });
  return m;
};

module.exports = { storeCompany };

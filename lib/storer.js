let mongo, mongoClient;

const _ = require('lodash'),
      logger = require('../utils/logger');

const { db, collection, username, password, host } = require(`../db-${process.env.NODE_ENV || 'test'}.json`);


/**
 * Stores received company object into MongoDB Atlas cluster.
 * @param {company} company object.
 * @param {m} instance to MongoDB client. If undefined, triest to initialize it
 * using ${username} and ${password} and ${host} variables
 */

const storeCompany = async (company, m) => {
  var uri = `mongodb+srv://${username}:${password}@${host}`;

  mongo = mongo || mongoClient || await require('mongodb').MongoClient.connect(
    uri, {
      ssl: true,
      useNewUrlParser: true,
    })
    .catch((e) => logger.error(e));


  const c =  mongo.db(db).collection(collection);
  if(_.isArray(company))
    return c.insertMany(company);
  else
    return c.insertOne(company);
};

module.exports = { storeCompany };

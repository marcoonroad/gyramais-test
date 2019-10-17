'use strict'

const mongodb = require('mongodb')
const promises = require('./promises')

const connection = promises.defer()

mongodb.MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/gyraplus-test-chat-api', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).connect((reason, client) => {
  try {
    if (reason) {
      connection.reject(reason)
    } else {
      const db = client.db()
      connection.resolve(db)
    }
  } catch (fatalError) {
    connection.reject(fatalError)
  }
})

const getConnection = () => {
  return connection.promise
}

module.exports.getConnection = getConnection

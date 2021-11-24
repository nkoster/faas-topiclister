require('dotenv').config()

module.exports = async (_, res) => {

  const DEBUG = true
  const DEV_DELAY = 0

  const fs = require('fs')

  const config = {
    database: process.env.PGDATABASE || 'kafkasearch',
    user: process.env.PGUSER || 'fhirstation',
    host: process.env.PGHOST || 'fhirstation-database-coordinator-0.fhirstation-database-coordinator',
    port: process.env.PGPORT || '5432',
    password: process.env.PGPASSWORD || 'postgres_password_123',
    ssl: {
      rejectUnauthorized: false,
      ca: fs.readFileSync(__dirname + '/tls/root.crt').toString(),
      key: fs.readFileSync(__dirname + '/tls/client_postgres.key').toString(),
      cert: fs.readFileSync(__dirname + '/tls/client_postgres.crt').toString()
    }
  }
  
  const { Pool } = require('pg')
  const clientPool = new Pool(config)
  
  let data

  const query = {
    name: 'GimmeTheTopix',
    text: 'SELECT * FROM kafka_topic'
  }

  const client = await clientPool.connect()

  data = await new Promise(async (resolve, reject) => {
    let result
    try {
      result = await client.query(query).catch(_ => console.log('Topiclister failed!'))
    } catch (err) {
      reject( { rows: [] } )
      console.log(err.message)
    } finally {
      resolve(result)
      client.release()
    }    
  })

  DEBUG && console.log('rows:', data?.rows?.length)

  if (DEV_DELAY > 0) {
    await new Promise(resolve => setTimeout(resolve, DEV_DELAY))
  }

  return res.status(200).send(data ? data.rows : [])

}

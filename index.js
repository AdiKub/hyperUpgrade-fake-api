const jsonServer = require('json-server')
const path = require('path')
const server = jsonServer.create()
const fs = require('fs')
const _ = require('lodash')

const FIRST_OBJECT_KEY = 0
const PORT = 8000;


let endpoints = [];
let objectDB = {};
const isJson = (str) => {
  try {
      JSON.parse(str);
  } catch (e) {
      return false;
  }
  return true;
}

let files = fs.readdirSync(path.resolve(__dirname, './src/db/'))
files.forEach((fileName) => {
  if (fileName.indexOf('.json') > -1) {
    const jsonObject = JSON.parse(fs.readFileSync('./src/db/' + fileName));

    if( isJson(fs.readFileSync('./src/db/' + fileName))) {
      endpoints.push(Object.keys(jsonObject)[FIRST_OBJECT_KEY]);
      console.log('🗒    JSON file loaded : ' + fileName);
      _.extend(objectDB, require(path.resolve(__dirname, './src/db/', fileName)));
    }
  }
})



const router = jsonServer.router(objectDB)
const middlewares = jsonServer.defaults()


server.use(jsonServer.rewriter({
  '/api/v1/*': '/inexpensive',
}))

server.use(middlewares)
server.use(router)


server.listen(PORT, () => {
  console.log('\n⛴    JSON Server is running at http://localhost:' + PORT );
  for (var i = 0; i < endpoints.length; i++) {
    console.info('🥁    Endpoint : http://localhost:' + PORT + '/' + endpoints[i]);
  }
})
 
const jsonServer = require('json-server')
const path = require('path')
const server = jsonServer.create()
const fs = require('fs')
const _ = require('lodash')
const bodyParser = require('body-parser')
const jwt = require('jsonwebtoken')

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

const userdb = JSON.parse(fs.readFileSync('./src/db/users.json', 'UTF-8'))

server.use(bodyParser.urlencoded({extended: true}))
server.use(bodyParser.json())
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789'

const expiresIn = '1h'

// Create a token from a payload 
function createToken(payload){
  return jwt.sign(payload, SECRET_KEY, {expiresIn})
}

// Verify the token 
function verifyToken(token){
  return  jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ?  decode : err)
}

// Check if the user exists in database
function isAuthenticated({email, password}){
  return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}

function getUserData({email, password}){
  return userdb.users[userdb.users.findIndex(user => user.email === email && user.password === password)]
}

// Register New User
server.post('/auth/register', (req, res) => {
  console.log("register endpoint called; request body:");
  const user = req.body;
  console.log(req.body);
  const {email, password, firstName, lastName} = req.body;

  if(isAuthenticated({email, password}) === true) {
    const status = 401;
    const message = 'Email and Password already exist';
    res.status(status).json({status, message});
    return
  }

fs.readFile("./src/db/users.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({status, message})
      return
    };
    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user
    var last_item_id = data.users[data.users.length-1].id;

    //Add new user
    data.users.push({
      id: last_item_id + 1, 
      firstName: firstName, 
      lastName: lastName,
      email: email, 
      password: password 
    }); //add some data
    var writeData = fs.writeFile("./src/db/users.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({status, message})
          return
        }
    });
});

// Create token for new user
// asdfadsfadsfadf
  
  const access_token = createToken({email, password});
  console.log("Access Token:" + access_token);
  res.status(200).json({access_token, user});
})

// Login to one of the users from ./users.json
server.post('/auth/login', (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const {email, password} = req.body;
  if (isAuthenticated({email, password}) === false) {
    const status = 401
    const message = 'Incorrect email or password'
    res.status(status).json({status, message})
    return
  }
  const access_token = createToken({email, password})
  const user = getUserData({email, password})
  console.log("Access Token:" + access_token);
  res.status(200).json({access_token, user})
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
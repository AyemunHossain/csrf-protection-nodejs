require('dotenv').config();
const express = require('express')
const cluster = require("cluster");
const app = express()
const os = require("os");
const cpus = os.cpus().length;
const port = 3000
const totalCPUs = require('node:os').cpus().length;
const session = require('express-session');
const csrf = require('csurf')
const csrfProtect = csrf({ cookie: true })
var cookieParser = require('cookie-parser')

var bodyParser = require('body-parser')
var parseForm = bodyParser.urlencoded({ extended: false })


app.use(cookieParser())
const sessionConfig = session({
  secret: process.env.CSRFT_SESSION_SECRET,
  keys: ['some random key'],
  resave: false,
  saveUninitialized: false,
  cookie: {
      maxAge: parseInt(process.env.CSRFT_EXPIRESIN),
      sameSite: 'strict',
      httpOnly: true, 
      domain: process.env.DOMAIN,
      secure: false
  }
});
app.use(sessionConfig);








if (cluster.isMaster) {
  console.log(`Number of CPUs is ${totalCPUs}`);
  console.log(`Master ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < totalCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
    console.log("Let's fork another worker!");
    cluster.fork();
  });

} else {
  runServer();
}

function runServer(){
  app.get('/', (req, res) => {
    res.send('Hello World')
  })


  app.get('/api/setCSRFToken', csrfProtect, (req, res, next) => {
    const token = req.csrfToken();
    res.send({csrfToken: token});
  });

app.post('/api/checkCSRFToken', parseForm, csrfProtect, function (req, res) {
    res.send({msg: 'CSRF Token is valid.'})
  }); // If the token is invalid, it throws a 'ForbiddenError: invalid csrf token' error.

  app.post('/api/csrf-vulnerable', function (req, res) {
    res.status(200).json({result: true, message: 'Hakced..'});
  });
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  });
}
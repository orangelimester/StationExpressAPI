let express = require('express');
let app = express();
let cors = require('cors');
let port = 4000;
let bodyParser = require('body-parser');
let http = require('http');

require('./app.js')(app);

const Logger = require('./service/loggerS')
const logger = new Logger('app');

app.use(cors());
app.use(express.static('./'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', 'extended': 'true'}));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));

app.use(function (req, res, next){

res.setHeader('Access-Control-Allow-Origin', '*');

res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');

res.setHeader('Access-Control-Allow-Credentials', true);

next();
});

http.createServer(app).listen(port,()=>logger.info("APP STARTED AT PORT "+port));
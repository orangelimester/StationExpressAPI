let express = require('express');
let app = express();
let cors = require('cors');
let bodyParser = require('body-parser');
let http = require('http');
const moment = require('moment');
const Logger = require('./service/loggerS')
const logger = new Logger('app');
const LRUCache = require('./service/lrucache')

const lrucache = new LRUCache(3);//Default LRU Cache limit is 10

const fetch = require('node-fetch');

app.use(cors());
app.use(express.static('./'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ limit: '50mb', 'extended': 'true'}));
app.use(bodyParser.json({type: 'application/vnd.api+json'}));

async function dataFetch(){
    try {
        var data = await fetch("https://feeds.citibikenyc.com/stations/stations.json",{ method: "GET" , timeout: 1000});
        var result = await data.json();	
    } catch (error) {
        return { "ERRORS": error };
    }
    lrucache.write("data",result);
    return result;
}

async function handlePageParam(pageParam){
    let error = {};
        if(isNaN(pageParam) || pageParam < 1 || pageParam % 1 != 0){
            logger.error("page parameter must be a positive integer");
            error["badPageQuery"] = "page parameter must be a positive integer";
            return error;
        }
        return true;
}

app.use(async function (req, res, next){

res.setHeader('Access-Control-Allow-Origin', '*');

res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,authorization');

res.setHeader('Access-Control-Allow-Credentials', true);
if(Object.keys(req.query).length != 0){
    if(!req.query.hasOwnProperty("page")){
    logger.error("Bad Query Parameter Found",req.query);
    res.status(400).end(JSON.stringify({ERRORS: "Bad Query Parameter Found"}));
    return;
    }
}

let pageParam = req.query.page;
/* Validating page parameters here before heading over to endpoint */
if(pageParam){
    var letUsPass = await handlePageParam(pageParam);
    if(letUsPass.badPageQuery){
    res.status(400).end(JSON.stringify({ERRORS: letUsPass}));
    return;
    }
}
/* Checking the lru cache
** if the execution time is 15 seconds after current time, a new data set is fetched
** This is done since it was noticed that the execution time changes approximately every 10-15 seconds in the result data set
** Therefore deemed necessary to only fetch new data after the updated time in the JSON
**/
if(lrucache.read("data")){
    if(moment().isAfter(moment(new Date(lrucache.read("data").executionTime)).add(15,'seconds'))){
        var content = await dataFetch();
    }else{
        var content = lrucache.read("data");
    }
}else{
var content = await dataFetch();
}
/* ERRORS object would catch timeout error from fetch */
if(content.ERRORS){
    logger.error("Data Source FetchError",content.ERRORS);
    res.status(503).end(JSON.stringify(content));
    return;
}
/* Result is put into response.locals so it can be accessed in the next callback */
res.locals.content = content;
next();
});

require('./app.js')(app);

module.exports = app

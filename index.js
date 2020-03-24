/* START FILE FOR STATION API - TAKE HOME CHALLENGE */

const app = require('./server');
const port = 4000;
const Logger = require('./service/loggerS')
const logger = new Logger('app');
app.listen(port,()=>logger.info("APP STARTED AT PORT "+port));
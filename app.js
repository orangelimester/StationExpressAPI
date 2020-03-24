module.exports = (app) => {
	const Logger = require('./service/loggerS')
	const logger = new Logger('app');

	// Base endpoint to check if server is up and running
	app.get('/',function(req,res){		 
		res.writeHead(200, { 'Content-Type': 'text/html'})
		res.write('No Data Requested, so nothing was returned.')
		res.end();
	})

	// Base stations endpoint
	app.get('/stations', async function(req,res){
		
		let content =  res.locals.content;
		let pageParam = req.query.page;

		logger.info("Request received at /stations"+((pageParam) ? "?page="+pageParam : ''))

		list = content.stationBeanList;
		/* If page query param exists, initialize a startPoint and endPoint accordingly for browsing purposes
		** Limited to 20 records per page
		**/
		let startPoint = pageParam ? 20 * parseInt(pageParam - 1) : 0;
		let endPoint = pageParam ? startPoint + 20 : list.length;

		let resultArray = [];
		for(let i = startPoint; i < endPoint; i++){
			if(!list[i]) break;
			resultArray.push({ 
			stationName: list[i].stationName, 
			address: list[i].stAddress1+' '+list[i].stAddress2,
			availableBikes: list[i].availableBikes,
			totalDocks: list[i].totalDocks
			})
		}
		logger.info("Successful Request!", {
			"success": true
		})
		res.writeHead(200, {'Content-Type': 'application/json'})
		res.end(JSON.stringify(resultArray));
	})

	// Endpoint to check for in-service stations
	app.get('/stations/in-service', async function(req,res){
		logger.info("Request received at /stations/in-service", req.query);
		let content =  res.locals.content;
		let pageParam = req.query.page;

		list = content.stationBeanList;
	
		/* Returns In Service records from fetched data 
		** This is done to satisfy the page browsing feature
		**/
		let f_list = list.reduce((acc,record) => { if(record.statusValue == "In Service") acc.push(record); return acc; },[]);

		let startPoint = pageParam ? 20 * parseInt(pageParam - 1) : 0;
		let endPoint = pageParam ? startPoint + 20 : f_list.length;

		let resultArray = [];
		for(let i = startPoint; i < endPoint; i++){
			if(!f_list[i]) break;
			resultArray.push({ 
			stationName: f_list[i].stationName, 
			address: f_list[i].stAddress1+' '+f_list[i].stAddress2,
			availableBikes: f_list[i].availableBikes,
			totalDocks: f_list[i].totalDocks
			})
		}
		logger.info("Successful Request!", {
			"success": true
		})
		res.writeHead(200, {'Content-Type': 'application/json'})
		res.end(JSON.stringify(resultArray));
	})

	// Endpoint for not in service. Same as in service endpoint but opposite.
	app.get('/stations/not-in-service', async function(req,res){
		logger.info("Request received at /stations/in-service", req.query);
		let content =  res.locals.content;
		let pageParam = req.query.page;

		list = content.stationBeanList;
			
		let f_list = list.reduce((acc,record) => { if(record.statusValue == "Not In Service") acc.push(record); return acc; },[]);

		let startPoint = pageParam ? 20 * parseInt(pageParam - 1) : 0;
		let endPoint = pageParam ? startPoint + 20 : f_list.length;

		let resultArray = [];
		for(let i = startPoint; i < endPoint; i++){
			if(!f_list[i]) break;
			resultArray.push({ 
			stationName: f_list[i].stationName, 
			address: f_list[i].stAddress1+' '+f_list[i].stAddress2,
			availableBikes: f_list[i].availableBikes,
			totalDocks: f_list[i].totalDocks
			})
		}
		logger.info("Successful Request!", {
			"success": true
		})
		res.writeHead(200, {'Content-Type': 'application/json'})
		res.end(JSON.stringify(resultArray));
	})

	// Endpoint to search records that match stationName or the addresses to the searchString.
	app.get('/stations/:searchString',async function(req,res){
		logger.info("Request received at /stations/:searchString", req.params);

		/* Since no pagination required, not allowing query parameters for this route */
		if(Object.keys(req.query).length != 0){
			logger.error("Query Parameter not allowed for this route",req.query);
			res.status(400).end(JSON.stringify({ERRORS: "Query Parameter not allowed for this route"}));
			return;
		}

		let content = res.locals.content;
		let searchString = req.params.searchString;
		list = content.stationBeanList;

		let f_list = list.reduce((acc,record) => { 
		if(	record.stationName.toLowerCase().includes(searchString.toLowerCase()) || 
			record.stAddress1.toLowerCase().includes(searchString.toLowerCase()) || 
			record.stAddress2.toLowerCase().includes(searchString.toLowerCase())
			)
			acc.push({ 
				stationName: record.stationName, 
				address: record.stAddress1+' '+record.stAddress2,
				availableBikes: record.availableBikes,
				totalDocks: record.totalDocks
				}); 
			return acc; 
			},[]);
			logger.info("Successful Request!", {
			"success": true
		})
		res.writeHead(200, {'Content-Type': 'application/json'})
		res.end(JSON.stringify(f_list));
	})

	// Endpoint to figure out dockable stations using stationid and number of bikes to return to the station
	app.get('/dockable/:stationid/:bikestoreturn',async function(req,res){
		logger.info("Request received at /stations/:stationid/:bikestoreturn", req.params);
		let content =  res.locals.content;
		let stationid = req.params.stationid;
		let bikestoreturn = req.params.bikestoreturn;

		/* Handling bad parameters */
		if(isNaN(stationid) || stationid <= 0){
			logger.error("Bad Route Parameter - stationid must be a numerical id",req.params);
			res.status(400).end(JSON.stringify({ERRORS: "Bad Route Parameter - stationid must be a numerical id, Found: "+req.params.stationid}));
			return;
		}
		if(isNaN(bikestoreturn) || bikestoreturn <= 0){
			logger.error("Bad Route Parameter - bikestoreturn must be a positive integer",req.params);
			res.status(400).end(JSON.stringify({ERRORS: "Bad Route Parameter - bikestoreturn must be a positive integer, Found: "+req.params.bikestoreturn}));
			return;
		}

		list = content.stationBeanList;

		/* Check if station exists based on stationid */
		let obj = list.find(item=>item.id==stationid);
		if(!obj){
			logger.error("stationid not found",req.params);
			res.writeHead(500, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({"ERRORS": "stationid not found"}))
			return;
		}
		let responseObject = {};
		if(obj.statusValue == "Not In Service"){
			responseObject = { dockable: false, message: "Station is not in service."}
			logger.info("Successful Request!", {
				"success": true
			})
			res.writeHead(200, {'Content-Type': 'application/json'})
			res.end(JSON.stringify(responseObject));
			return;
		}
		let availableDocks = parseInt(obj.availableDocks);
		if(availableDocks >= bikestoreturn){
			responseObject = { dockable: true, message: "Station is dockable.(Available Docks: "+availableDocks+")(Remaining Docks after return: "+(availableDocks - bikestoreturn)+")"}
		}else if(availableDocks < bikestoreturn){
			responseObject = { dockable: false, message: "Station is not dockable.(Available Docks: "+availableDocks+")(Docks Required: "+(bikestoreturn - availableDocks)+")"}
		}
		logger.info("Successful Request!", {
			"success": true
		})
		res.writeHead(200, {'Content-Type': 'application/json'})
		res.end(JSON.stringify(responseObject));
	})

	// Endpoint to handle invalid routes
	app.get('*', function(req,res){
		logger.error("Page Not Found at "+req.params[0]);
		res.status(404).send("Sorry. The route "+req.params[0]+" cannot be found.")
	})
}
const fetch = require('node-fetch');

module.exports = (app) => {
	const Logger = require('./service/loggerS')
	const logger = new Logger('app');

	async function dataFetch(){
		try {
			var data = await fetch("https://feeds.citibikenyc.com/stations/stations.json",{ method: "GET" , timeout: 200});
			var result = await data.json();	
		} catch (error) {
			return { "ERRORS": error };
		}

		return result;
	}

	async function handlePageParam(pageParam){
		let error = {};
			if(isNaN(pageParam)){
				logger.error("page parameter must be an integer");
				error["badPageQuery"] = "page must be an integer";
				return error;
			}
			if(pageParam < 1){
				logger.error("page parameter must be an integer greater than 0");
				error["badPageQuery"] = "page must be > 0";
				return error;
			}
			if(pageParam % 1 != 0){
				logger.error("page parameter must be integer");
				error["badPageQuery"] = "page must be > 0";
				return error;
			}
			return true;
	}
	app.get('/',function(req,res){		 
		res.writeHead(200, { 'Content-Type': 'text/html'})
		res.write('No Data Requested, so nothing was returned.')
		res.end();
	})

	app.get('/stations', async function(req,res){
		logger.info("Request received at /stations")
		if(Object.keys(req.query).length != 0){
			if(!req.query.hasOwnProperty("page")){
			logger.error("Bad Query Parameter Found",req.query);
			res.status(500).end(JSON.stringify({ERRORS: "Bad Query Parameter Found"}));
			return;
			}
		}
		let content =  await dataFetch();
		if(content.ERRORS){
			logger.error("Data Source FetchError",content.ERRORS);
			res.status(503).end(JSON.stringify(content));
			return;
		}
		let error = {};
		let pageParam = req.query.page;
		if(pageParam){
			var letUsPass = await handlePageParam(pageParam);
			if(letUsPass.badPageQuery){
			res.status(500).end(JSON.stringify({ERRORS: letUsPass}));
			return;
			}
		}
		list = content.stationBeanList;
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

	app.get('/stations/in-service', async function(req,res){
		logger.info("Request received at /stations/in-service", req.query);
		if(Object.keys(req.query).length != 0){
			if(!req.query.hasOwnProperty("page")){
			logger.error("Bad Query Parameter Found",req.query);
			res.status(400).end(JSON.stringify({ERRORS: "Bad Query Parameter Found"}));
			return;
			}
		}
		let content = await dataFetch();
		if(content.ERRORS){
			logger.error("Data Source FetchError",content.ERRORS);
			res.status(503).end(JSON.stringify(content));
			return;
		}
		let pageParam = req.query.page;

		if(pageParam){
			var letUsPass = await handlePageParam(pageParam);
			if(letUsPass.badPageQuery){
			res.status(400).end(JSON.stringify({ERRORS: letUsPass}));
			return;
			}
		}

		list = content.stationBeanList;
	
		let resultArray = [];
		let f_list = list.reduce((acc,record) => { if(record.statusValue == "In Service") acc.push(record); return acc; },[]);
		let startPoint = pageParam ? 20 * parseInt(pageParam - 1) : 0;
		let endPoint = pageParam ? startPoint + 20 : f_list.length;
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

	app.get('/stations/:searchString',async function(req,res){
		logger.info("Request received at /stations/:searchString", req.params);
		if(Object.keys(req.query).length != 0){
			logger.error("Query Parameter not allowed for this route",req.query);
			res.status(400).end(JSON.stringify({ERRORS: "Query Parameter not allowed for this route"}));
			return;
		}
		let content = await dataFetch();
		if(content.ERRORS){
			logger.error("Data Source FetchError",content.ERRORS);
			res.status(503).end(JSON.stringify(content));
			return;
		}
		let searchString = req.params.searchString;
		list = content.stationBeanList;

		let f_list = list.reduce((acc,record) => { 
		if(	record.stationName.toLowerCase().includes(searchString.toLowerCase()) || 
			record.stAddress1.toLowerCase().includes(searchString.toLowerCase()) || 
			record.stAddress2.toLowerCase().includes(searchString.toLowerCase())
			)
			acc.push(record); 
			return acc; 
			},[]);
			logger.info("Successful Request!", {
			"success": true
		})
		res.writeHead(200, {'Content-Type': 'application/json'})
		res.end(JSON.stringify(f_list));
	})

	app.get('/dockable/:stationid/:bikestoreturn',async function(req,res){
		logger.info("Request received at /stations/:stationid/:bikestoreturn", req.params);
		let content = await dataFetch();
		if(content.ERRORS){
			logger.error("Data Source FetchError",content.ERRORS);
			res.status(503).end(JSON.stringify(content));
			return;
		}
		let stationid = req.params.stationid;
		let bikestoreturn = req.params.bikestoreturn;
		if(isNaN(stationid)){
			logger.error("Bad Route Parameter - stationid must be a numerical id",req.params);
			res.status(400).end(JSON.stringify({ERRORS: "Bad Route Parameter - stationid must be a numerical id, Found: "+req.params.stationid}));
			return;
		}
		if(isNaN(bikestoreturn)){
			logger.error("Bad Route Parameter - bikestoreturn must be an integer",req.params);
			res.status(400).end(JSON.stringify({ERRORS: "Bad Route Parameter - bikestoreturn must be an integer, Found: "+req.params.bikestoreturn}));
			return;
		}
		list = content.stationBeanList;
		let obj = list.find(item=>item.id==stationid);
		if(!obj){
			logger.error("stationid not found",req.params);
			res.writeHead(500, {'Content-Type': 'application/json'});
			res.end(JSON.stringify({"ERRORS": "stationid not found"}))
			return;
		}
		let availableDocks = parseInt(obj.availableDocks);
		let responseObject = {};
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

	app.get('*', function(req,res){
		logger.error("Page Not Found at "+req.params[0]);
		res.status(404).send("Sorry. The route "+req.params[0]+" cannot be found.")
	})
}
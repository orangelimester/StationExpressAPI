const app = require('../server.js')
const supertest = require('supertest')
const request = supertest(app)

describe('Initial base test of endpoint', () => {
it('Test /stations endpoint', async done => {
    const res = await request.get('/stations')
    /*Data source can timeout so I leave the 503 status code to be expected and handled accordingly*/
    expect(res.status.toString()).toMatch(/200|503/)
    if(res.status == 200)
    /* Testing validity of JSON */
    expect(Object.keys(JSON.parse(res.text)[0])).toEqual(expect.arrayContaining([ 'stationName', 'address', 'availableBikes', 'totalDocks' ]));
    if(res.status == 503)
    expect(Object.keys(JSON.parse(res.error.text))).toEqual(expect.arrayContaining([ 'ERRORS' ]));
    done();
})
it('Test /stations/in-service endpoint', async done => {
    const res = await request.get('/stations/in-service')
    expect(res.status.toString()).toMatch(/200|503/)
    if(res.status == 200)
    expect(Object.keys(JSON.parse(res.text)[0])).toEqual(expect.arrayContaining([ 'stationName', 'address', 'availableBikes', 'totalDocks' ]));
    if(res.status == 503)
    expect(Object.keys(JSON.parse(res.error.text))).toEqual(expect.arrayContaining([ 'ERRORS' ]));
    done();
})
it('Test invalid route /wrongRoute', async done => {
    const res = await request.get('/wrongRoute')
    expect(res.status).toBe(404)
    done();
})
it('Test invalid route /stations/wrong/route', async done => {
    const res = await request.get('/stations/wrong/route')
    expect(res.status).toBe(404)
    done();
})
})


describe('Testing with query parameters and search string ', () => {
    it('Test /stations endpoint with page 1', async done => {
        res = await request.get('/stations?page=1')
        expect(res.status.toString()).toMatch(/200|503/)
        if(res.status == 200){
        expect(Object.keys(JSON.parse(res.text)[0])).toEqual(expect.arrayContaining([ 'stationName', 'address', 'availableBikes', 'totalDocks' ]));
        expect(JSON.parse(res.text).length).toBe(20);
        }
        done();
    })
    it('Test /stations endpoint with bad page query as string type value', async done => {
        res = await request.get('/stations?page=abc')
        expect(res.status).toBe(400)
        expect(JSON.parse(res.error.text)).toStrictEqual({ "ERRORS":  {"badPageQuery": "page parameter must be a positive integer"}})
        done();
    })
    it('Test /stations/:searchstring endpoint', async done => {
        res = await request.get('/stations/wythe')
        expect(res.status.toString()).toMatch(/200|503/)
        if(res.status == 200){
        expect(Object.keys(JSON.parse(res.text)[0])).toEqual(expect.arrayContaining([ 'stationName', 'address', 'availableBikes', 'totalDocks' ]));
        expect(JSON.parse(res.text).every(item => item.stationName.toLowerCase().includes('wythe') || item.address.toLowerCase().includes('wythe'))).toBe(true);
        }
        done();
    })
})


describe('Testing dockable endpoint with stationid and bikestoreturn parameters', () => {
    it('Test /dockable/:stationid/:bikestoreturn endpoint with good parameters', async done => {
        res = await request.get('/dockable/72/1')
        expect(res.status.toString()).toMatch(/200|503/)
        if(res.status == 200){
            expect(Object.keys(res.body)).toEqual(expect.arrayContaining([ 'dockable','message' ]));
        }        
        done();
    })
    it('Test /dockable/:stationid/:bikestoreturn endpoint with bad stationid param', async done => {
        res = await request.get('/dockable/abc/1')
        expect(res.status).toBe(400)
        expect(JSON.parse(res.error.text)).toStrictEqual({"ERRORS": "Bad Route Parameter - stationid must be a numerical id, Found: abc"})
        done();
    })
    it('Test /dockable/:stationid/:bikestoreturn endpoint with bad bikestoreturn param', async done => {
        res = await request.get('/dockable/72/1a')
        expect(res.status).toBe(400)
        expect(JSON.parse(res.error.text)).toStrictEqual({"ERRORS": "Bad Route Parameter - bikestoreturn must be a positive integer, Found: 1a"})
        done();
    })
})

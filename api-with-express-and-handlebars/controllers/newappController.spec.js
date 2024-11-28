const request = require('supertest')
const server = require('../server') // assumed server file
const bent = require('bent')
const packageJson = require('../package.json')
jest.mock('bent')
jest.mock('../package.json')


describe('Test the root path', () => {
  test('It should response the GET method', async () => {
    const response = await request(server).get('/');
    expect(response.statusCode).toBe(200);
  });

  test('It should render the home page correctly', async () => {
    const response = await request(server).get('/');
    expect(response.text).toMatch('<title>Home</title>') // Assume home.hbs has this title tag
  });
});


describe('Test dependencies', () => {
  test('Should render dependencies correctly', async () => {
    packageJson.dependencies = { react: "^17.0.2", jest: "^27.4.5" };
    const response = await request(server).get('/dependencies');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual([{ name: "react", version: "^17.0.2" }, { name: "jest", version: "^27.4.5" }]);
  });
});


describe('Test secure and latest releases', () => {
 const mockReleases = [ { version: "v14.18.0", security:true }, { version: "v16.10.1", security: false }, { version: "v16.11.0", security: true }];
  beforeEach(() => {
    bent.mockResolvedValue(mockReleases);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Should fetch secure releases correctly', async () => {
    const response = await request(server).get('/minimum-secure');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ "v14": { version: "v14.18.0", security: true }, "v16": { version: "v16.11.0", security: true }});
  });

  test('Should fetch latest releases correctly', async () => {
    const response = await request(server).get('/latest-releases');
    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ "v14": { version: "v14.18.0", security: true }, "v16": { version: "v16.11.0", security: true }});
  });
});
  

describe('Test errors', () => {
 test('Should return error on failed fetch', async () => {
    bent.mockRejectedValue('Failed to fetch...');
    const response = await request(server).get('/latest-releases');
    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ message: 'Unable to fetch data on /latest-releases' });
  });
});
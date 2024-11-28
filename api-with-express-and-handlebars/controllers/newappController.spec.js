const bent = require('bent');
const getJSON = jest.fn();
jest.mock('bent', () => {
  return () => getJSON;
});
const semverMajor = jest.fn();
jest.mock('semver/functions/major', () => semverMajor);
const semverGt = jest.fn();
jest.mock('semver/functions/gt', () => semverGt);
jest.mock('../package.json', () => ({ dependencies: { dep1: '1.0.0', dep2: '2.0.0' } }));

const mockReleases = [
  { version: 'v1.0.0', security: true },
  { version: 'v2.0.0', security: false },
  { version: 'v1.1.0', security: false },
  { version: 'v1.0.1', security: true },
  { version: 'v2.0.1', security: true },
];

const { dependencies, minimumSecurePage, latestReleasesPage, minimumSecure, latestReleases, home } = require('../YourModule');

describe('NodeJS API handler', () => {
  const res = {
    render: jest.fn(),
    setHeader: jest.fn(),
    json: jest.fn(),
  };
  const req = { route: { path: '/test/path' } };

  beforeEach(() => {
    jest.clearAllMocks();
    getJSON.mockResolvedValue(mockReleases);
    semverMajor.mockImplementation((version) => parseInt(version.replace('v', ''), 10));
    semverGt.mockImplementation((a, b) => a.version > b.version);
  });

  test('dependencies', () => {
    dependencies(req, res);
    expect(res.render).toHaveBeenCalledWith('dependencies.hbs', {
      dependencies: [
        { name: 'dep1', version: '1.0.0' },
        { name: 'dep2', version: '2.0.0' },
      ],
    });
  });

  test('minimumSecurePage', async () => {
    await minimumSecurePage(req, res);
    expect(getJSON).toHaveBeenCalledWith('https://nodejs.org/dist/index.json');
    expect(res.render).toHaveBeenCalledWith('minimum-secure.hbs', {
      result: JSON.stringify({ v1: mockReleases[3], v2: mockReleases[4] }, undefined, '  ')
    });
  });

  test('latestReleasesPage', async () => {
    await latestReleasesPage(req, res);
    expect(getJSON).toHaveBeenCalledWith('https://nodejs.org/dist/index.json');
    expect(res.render).toHaveBeenCalledWith('latest-releases.hbs', {
      result: JSON.stringify({ v1: mockReleases[2], v2: mockReleases[4] }, undefined, '  ')
    });
  });

  test('minimumSecure with error', async () => {
    getJSON.mockRejectedValue(new Error('Fetch error'));
    await minimumSecure(req, res);
    expect(res.json).toHaveBeenCalledWith({
      error: new Error('Fetch error'),
      message: 'Unable to fetch data on /test/path',
    });
  });

  test('latestReleases', async () => {
    await latestReleases(req, res);
    expect(getJSON).toHaveBeenCalledWith('https://nodejs.org/dist/index.json');
    expect(res.json).toHaveBeenCalledWith({ v1: mockReleases[2], v2: mockReleases[4] });
  });

  test('home', () => {
    home(req, res);
    expect(res.render).toHaveBeenCalledWith('home.hbs');
  });
});
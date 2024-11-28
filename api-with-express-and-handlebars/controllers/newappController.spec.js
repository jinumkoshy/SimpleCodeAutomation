```typescript
import { dependencies, minimumSecurePage, latestReleasesPage, minimumSecure, latestReleases, home } from 'modulePath';
import { mocked } from 'ts-jest/utils'

jest.mock('bent', () => {
  return jest.fn().mockResolvedValue([
    // sample data that showcases your test scenarios
    { version: 'v14.17.1', security: true },
    { version: 'v14.17.2', security: true },
    { version: 'v14.17.3', security: false },
  ])
})
jest.mock('semver/functions/major', () => jest.fn())
jest.mock('semver/functions/gt', () => jest.fn())
jest.mock('../package.json', () => ({ dependencies: { test: '^1.0.0' }}))

describe('Controller Tests', () => {
  let mockRes: any;
  let mockReq: any;

  let getJSON: any;
  let semverMajor: any;
  let semverGt: any;

  beforeEach(() => {
    // mock res and req objects
    mockRes = {
      render: jest.fn(),
      json: jest.fn(),
      setHeader: jest.fn(),
    }
    mockReq = {
      route: {
        path: '/test'
      }
    };

    getJSON = mocked(bent, true)
    semverMajor = mocked(major, true)
    semverGt = mocked(gt, true)

    getJSON.mockClear()
    semverMajor.mockClear()
    semverGt.mockClear()
  })

  // write down your tests below
  test('Should render dependencies', () => {
    dependencies(mockReq, mockRes);
    expect(mockRes.render).toHaveBeenCalledWith('dependencies.hbs', { dependencies: [{name: 'test', version: '^1.0.0'}] });
  });

  test('Should render minimumSecurePage', async () => {
    await minimumSecurePage(mockReq, mockRes);
    expect(mockRes.render).toHaveBeenCalled();
  });

  test('Should render latestReleasesPage', async () => {
    await latestReleasesPage(mockReq, mockRes);
    expect(mockRes.render).toHaveBeenCalled();
  });

  test('Should send minimumSecure JSON', async () => {
    await minimumSecure(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalled();
  });

  test('Should send latestReleases JSON', async () => {
    await latestReleases(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalled();
  });

  test('Should send error response when error thrown', async () => {
    getJSON.mockImplementationOnce(throw new Error('Mocked error'));
    await latestReleases(mockReq, mockRes);
    expect(mockRes.json).toHaveBeenCalledWith({ error: new Error('Mocked error'), message: `Unable to fetch data on /test` });
  });

  test('Should render home page correctly', () => {    
    home(mockReq, mockRes);
    expect(mockRes.render).toHaveBeenCalledWith('home.hbs');
  });

});

```
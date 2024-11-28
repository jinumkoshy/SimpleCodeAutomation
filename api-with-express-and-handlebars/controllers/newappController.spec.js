import { dependencies, minimumSecurePage, latestReleasesPage, minimumSecure, latestReleases, home } from './yourModule';
import bent from 'bent';
import { Request, Response } from 'express';

jest.mock('bent');
jest.mock('semver/functions/major', () => jest.fn());
jest.mock('semver/functions/gt', () => jest.fn());
jest.mock('../package.json', () => ({
  dependencies: {
    'package1': '1.0.0',
    'package2': '2.0.0'
  }
}));

describe('Test suite for NodeJS versioning control', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = {};
    res = {
      render: jest.fn(),
      setHeader: jest.fn(),
      json: jest.fn()
    };
  });

  test('dependencies should return package dependencies', () => {
    dependencies(req as Request, res as Response);
    expect(res.render).toHaveBeenCalledWith('dependencies.hbs', { dependencies: [{ name: 'package1', version: '1.0.0' }, { name: 'package2', version: '2.0.0' }] });
  });

  test('minimumSecurePage should handle valid outcomes', async () => {
    (bent as jest.Mock).mockResolvedValue([{ version: '1.0.0', security: true }, { version: '2.0.0', security: false }]);

    await minimumSecurePage(req as Request, res as Response);

    expect(res.render).toHaveBeenCalled();
  });

  test('minimumSecurePage should handle errors', async () => {
    (bent as jest.Mock).mockRejectedValue(new Error('Network error'));

    await minimumSecurePage(req as Request, res as Response);

    expect(res.render).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ error: new Error('Network error'), message: `Unable to fetch data on undefined` });
  });

  test('latestReleasesPage should handle valid outcomes', async () => {
    (bent as jest.Mock).mockResolvedValue([{ version: '1.0.0' }, { version: '2.0.0' }]);

    await latestReleasesPage(req as Request, res as Response);

    expect(res.render).toHaveBeenCalled();
  });

  test('latestReleasesPage should handle errors', async () => {
    (bent as jest.Mock).mockRejectedValue(new Error('Network error'));

    await latestReleasesPage(req as Request, res as Response);

    expect(res.render).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ error: new Error('Network error'), message: `Unable to fetch data on undefined` });
  });

  test('minimumSecure should handle valid outcomes', async () => {
    (bent as jest.Mock).mockResolvedValue([{ version: '1.0.0', security: true }, { version: '2.0.0', security: false }]);

    await minimumSecure(req as Request, res as Response);

    expect(res.json).toHaveBeenCalled();
  });

  test('minimumSecure should handle errors', async () => {
    (bent as jest.Mock).mockRejectedValue(new Error('Network error'));

    await minimumSecure(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ error: new Error('Network error'), message: `Unable to fetch data on undefined` });
  });

  test('latestReleases should handle valid outcomes', async () => {
    (bent as jest.Mock).mockResolvedValue([{ version: '1.0.0' }, { version: '2.0.0' }]);

    await latestReleases(req as Request, res as Response);

    expect(res.json).toHaveBeenCalled();
  });

  test('latestReleases should handle errors', async () => {
    (bent as jest.Mock).mockRejectedValue(new Error('Network error'));

    await latestReleases(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ error: new Error('Network error'), message: `Unable to fetch data on undefined` });
  });

  test('home', () => {
    home(req as Request, res as Response);
    expect(res.render).toHaveBeenCalledWith('home.hbs');
  });
});
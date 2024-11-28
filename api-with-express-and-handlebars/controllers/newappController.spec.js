const controllers = require('./controllers'); // Replace this with the actual path to your controllers file.
const packageJson = require('../package.json');

jest.mock('bent', () => {
  return () => jest.fn();
});

const getJSON = require('bent')();

describe('Controllers', () => {
  describe('dependencies', () => {
    it('should render the correct template with the right data', () => {
      const mockRes = {
        render: jest.fn(),
      };
  
      controllers.dependencies(null, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('dependencies.hbs', {
        dependencies: Object.entries(packageJson.dependencies).map(([key, value]) => ({
          name: key,
          version: value,
        })),
      });
    });
  });

  describe('minimumSecurePage', () => {
    it('should render the correct template with the right data when getJSON resolves', async () => {
      const mockData = [{ version: '1.1.1', security: true }];
      const mockRes = { render: jest.fn() };
      getJSON.mockResolvedValueOnce(mockData);

      await controllers.minimumSecurePage(null, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('minimum-secure.hbs', {
        result: JSON.stringify({ v1: mockData[0] }, undefined, '  '),
      });
    });

    it('should handle it correctly when getJSON rejects', async () => {
      const mockRes = { render: jest.fn() };
      getJSON.mockRejectedValueOnce(new Error('Error'));

      await controllers.minimumSecurePage(null, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('minimum-secure.hbs', {
        result: '{}',
      });
    });
  });

  describe('latestReleasesPage', () => {
    it('should render the correct template with the right data when getJSON resolves', async () => {
      const mockData = [{ version: '1.1.1' }];
      const mockRes = { render: jest.fn() };
      getJSON.mockResolvedValueOnce(mockData);

      await controllers.latestReleasesPage(null, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('latest-releases.hbs', {
        result: JSON.stringify({ v1: mockData[0] }, undefined, '  '),
      });
    });

    it('should handle it correctly when getJSON rejects', async () => {
      const mockRes = { render: jest.fn() };
      getJSON.mockRejectedValueOnce(new Error('Error'));

      await controllers.latestReleasesPage(null, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('latest-releases.hbs', {
        result: '{}',
      });
    });
  });

  describe('minimumSecure', () => {
    // Test cases for minimumSecure similar to minimumSecurePage
  });

  describe('latestReleases', () => {
    // Test cases for latestReleases similar to latestReleasesPage
  });

  describe('home', () => {
    it('should render the correct template', () => {
      const mockRes = {
        render: jest.fn(),
      };
  
      controllers.home(null, mockRes);

      expect(mockRes.render).toHaveBeenCalledWith('home.hbs');
    });
  });
});
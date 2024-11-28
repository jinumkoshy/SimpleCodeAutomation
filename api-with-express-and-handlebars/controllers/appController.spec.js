const controllers = require('./controllers');

jest.mock('bent', () => {
  return () => jest.fn(() => [
    { version: 'v1.0.0', security: true },
    { version: 'v1.1.0', security: true },
    { version: 'v2.0.0' },
  ]);
});

describe('Controllers', () => {

  describe('minimumSecure', () => {
    it('should return all secured node releases', async () => {
      const req = {route: {path: ''}};
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };
      await controllers.minimumSecure(req, res);
      expect(res.json.mock.calls[0][0]).toEqual({
        'v1': { version: 'v1.1.0', security: true }
      });
    });
  });

  describe('latestReleases', () => {
    it('should return latest node releases', async () => {
      const req = {route: {path: ''}};
      const res = {
        setHeader: jest.fn(),
        json: jest.fn()
      };
      await controllers.latestReleases(req, res);
      expect(res.json.mock.calls[0][0]).toEqual({
        'v1': { version: 'v1.1.0', security: true },
        'v2': { version: 'v2.0.0' }
      });
    });
  });

  describe('home', () => {
    it('should render home page', () => {
      const req = {};
      const res = {
        render: jest.fn()
      };
      controllers.home(req, res);
      expect(res.render.mock.calls[0][0]).toBe('home.hbs');
    });
  });

  // Add more tests here for other controllers
});
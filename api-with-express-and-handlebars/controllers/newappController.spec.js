describe("NodeJS Release Information", () => {
  let req, res;

  beforeEach(() => {
    req = {
      route: {
        path: "test"
      }
    };

    res = {
      render: jest.fn(),
      json: jest.fn(),
      setHeader: jest.fn()
    };
  });

  describe("#dependencies", () => {
    it("Should render dependencies correctly", () => {
      require('../index').dependencies(req, res);
      expect(res.render).toHaveBeenCalled();
    });
  });

  describe("#minimumSecurePage", () => {
    it("Should handle rendering of minimum secure page", async () => {
      jest.spyOn(global, "getJSON").mockResolvedValueOnce([
        { version: "v1.0.0", security: true },
        { version: "v2.0.0" },
        { version: "v2.0.1", security: true }
      ]);

      await require('../index').minimumSecurePage(req, res);
      expect(res.render).toHaveBeenCalled();
    });

    it("Should handle error when fetching data", async () => {
      jest.spyOn(global, "getJSON").mockRejectedValueOnce(new Error());
      await require('../index').minimumSecurePage(req, res);
      expect(res.render).toHaveBeenCalled();
    });
  });

  describe("#latestReleasesPage", () => {
    it("Should handle rendering of latest releases page", async () => {
      jest.spyOn(global, "getJSON").mockResolvedValueOnce([
        { version: "v1.0.0", security: false },
        { version: "v2.0.0", security: false },
        { version: "v3.0.0", security: true }
      ]);

      await require('../index').latestReleasesPage(req, res);
      expect(res.render).toHaveBeenCalled();
    });

    it("Should handle error when fetching data", async () => {
      jest.spyOn(global, "getJSON").mockRejectedValueOnce(new Error());
      await require('../index').latestReleasesPage(req, res);
      expect(res.render).toHaveBeenCalled();
    });
  });

  describe("#minimumSecure", () => {
    it("Should return minimum secure release data", async () => {
      jest.spyOn(global, "getJSON").mockResolvedValueOnce([
        { version: "v1.0.0", security: true },
        { version: "v2.0.0" },
        { version: "v2.0.1", security: true }
      ]);

      await require('../index').minimumSecure(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("Should handle error when fetching data", async () => {
      jest.spyOn(global, "getJSON").mockRejectedValueOnce(new Error());
      await require('../index').minimumSecure(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("#latestReleases", () => {
    it("Should return latest release data", async () => {
      jest.spyOn(global, "getJSON").mockResolvedValueOnce([
        { version: "v1.0.0", security: false },
        { version: "v2.0.0", security: false },
        { version: "v3.0.0", security: true }
      ]);

      await require('../index').latestReleases(req, res);
      expect(res.json).toHaveBeenCalled();
    });

    it("Should handle error when fetching data", async () => {
      jest.spyOn(global, "getJSON").mockRejectedValueOnce(new Error());
      await require('../index').latestReleases(req, res);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe("#home", () => {
    it("Should render home screen", () => {
      require('../index').home(req, res);
      expect(res.render).toHaveBeenCalled();
    });
  });
});
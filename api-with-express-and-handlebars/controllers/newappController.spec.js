// Mock the third-party libraries being used.
jest.mock('bent')

// Import the dependencies needed for testing.
import { dependencies, minimumSecurePage, latestReleasesPage, minimumSecure, latestReleases, home } from './your-code-file'
const bent = require('bent')

describe("Version Functions", () => {

  const mockRender = jest.fn()
  const mockJson = jest.fn()
  const mockSetHeader = jest.fn()

  const req = {}
  const res = {
    render: mockRender,
    json: mockJson,
    setHeader: mockSetHeader
  }

  beforeEach(() => {
    jest.clearAllMocks()
  }) 

  test("Test for dependencies function", () => {
    dependencies(req, res)
    expect(mockRender).toHaveBeenCalled()
    expect(mockRender).toHaveBeenCalledWith('dependencies.hbs', { dependencies: [{ name: "key", version: "value" }]})
  })

  test("Test for minimumSecurePage function", async () => {
    bent.mockResolvedValue([{ version: 'v1.2.3', security: true, name: 'release1' }, { version: 'v2.3.4', security: true, name: 'release2' }])
    await minimumSecurePage(req, res)
    expect(mockRender).toHaveBeenCalled()
  })

  test("Test for latestReleasesPage function", async () => {
    bent.mockResolvedValue([{ version: 'v1.2.3', name: 'release1' }, { version: 'v2.3.4', name: 'release2' }])
    await latestReleasesPage(req, res)
    expect(mockRender).toHaveBeenCalled()
  })

  test("Test for minimumSecure function", async () => {
    bent.mockResolvedValue([{ version: 'v1.2.3', security: true, name: 'release1' }, { version: 'v2.3.4', security: true, name: 'release2' }])
    await minimumSecure(req, res)
    expect(mockSetHeader).toHaveBeenCalled()
    expect(mockJson).toHaveBeenCalled()
  })

  test("Test for latestReleases function", async () => {
    bent.mockResolvedValue([{ version: 'v1.2.3', name: 'release1' }, { version: 'v2.3.4', name: 'release2' }])
    await latestReleases(req, res)
    expect(mockSetHeader).toHaveBeenCalled()
    expect(mockJson).toHaveBeenCalled()
  })

  test("Test for home function", () => {
    home(req, res)
    expect(mockRender).toHaveBeenCalled()
    expect(mockRender).toHaveBeenCalledWith('home.hbs')
  })
})
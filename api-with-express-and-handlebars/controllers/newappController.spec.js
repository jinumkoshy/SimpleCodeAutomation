// Test data
const releases = [
  { version: 'v1.0.0', security: true },
  { version: 'v1.0.1', security: false },
  { version: 'v2.0.0', security: false },
  { version: 'v2.0.1', security: true }
]

// Mock dependencies
jest.mock('bent', () => () => () => releases)
jest.mock('semver/functions/major', () =>
  jest.fn((version) => Number(version.slice(1, 2)))
)
jest.mock('semver/functions/gt', () => jest.fn(() => true))
jest.mock('../package.json', () => ({
  dependencies: { dep1: '1.0.0', dep2: '2.0.0' }
}))

// Mock HTTP response
const res = {
  render: jest.fn(),
  json: jest.fn(),
  setHeader: jest.fn()
}
const req = { route: { path: '/test' } }

// Import functions
const { latestReleases, minimumSecure } = require('../filename')

// Test cases
describe('latestReleases', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return the latest releases', async () => {
    await latestReleases(req, res)
    expect(res.json).toHaveBeenCalledWith({
      'v1': { version: 'v1.0.1', security: false },
      'v2': { version: 'v2.0.1', security: true }
    })
  })

  it('should return an error if there is an issue with fetching data', async () => {
    jest.mock('bent', () => {
      throw new Error('Fetching error')
    })
    await latestReleases(req, res)
    expect(res.json).toHaveBeenCalledWith({
      error: new Error('Fetching error'),
      message: 'Unable to fetch data on /test'
    })
  })
})

describe('minimumSecure', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should return secure releases', async () => {
    await minimumSecure(req, res)
    expect(res.json).toHaveBeenCalledWith({
      'v1': { version: 'v1.0.0', security: true },
      'v2': { version: 'v2.0.1', security: true }
    })
  })

  it('should return an error if there is an issue with fetching data', async () => {
    jest.mock('bent', () => {
      throw new Error('Fetching error')
    })
    await minimumSecure(req, res)
    expect(res.json).toHaveBeenCalledWith({
      error: new Error('Fetching error'),
      message: 'Unable to fetch data on /test'
    })
  })
})
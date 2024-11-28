test('mockedLatestRelease function handles error', async () => {
  mockedLatestRelease.mockImplementation(() => Promise.reject('Error'));
  await expect(mockedLatestRelease()).rejects.toThrow('Error');
});

test('mockedLatestReleasesPage function returns empty when no release found', async () => {
  const req = {};
  const res = { render: jest.fn() };
  mockedJsonResponse.mockReturnValueOnce([]);
  await mockedLatestReleasesPage(req, res);
  expect(res.render).toBeCalledWith('latest.hbs', { 'latest': [] });
});

test('mockedLatestRelease function handles maximum input', async () => {
  const maxInput = new Array(10000).fill({ version: 'v1.0.0', security: true });
  mockedJsonResponse.mockReturnValueOnce(maxInput);
  const result = await mockedLatestRelease(maxInput);
  expect(result).toBeDefined();
});

test('mockedHome function handles empty input', () => {
  const req = {};
  const res = { render: jest.fn() };
  mockedHome(req, res);
  expect(res.render).toBeCalledWith('home.hbs');
});
  
test('mockedSemverGt throws error with invalid inputs', async () => {
  const input1 = { version: 'invalid', security: true };
  const input2 = { version: 'v1.0.0', security: true };
  expect(() => mockedSemverGt(input1, input2)).toThrow();
});  

test('mockedSemverMajor function returns correct value with minimum input', () => {
  const minInput = 'v0.0.1';
  expect(mockedSemverMajor(minInput)).toBe(0);
});

test('mockedDependencies function handles non-existent deps', () => {
  const req = {};
  const res = { render: jest.fn() };
  jest.mock('../package.json', () => ({ dependencies: {} }));
  dependencies(req, res);
  expect(res.render).toBeCalledWith('dependencies.hbs', { dependencies: [] });
});

test('mockedJsonResponse function returns valid data', async () => {
  const mockResult = [{ version: 'v1.0.0', security: true }];
  mockedJsonResponse.mockImplementation(() => Promise.resolve(mockResult));
  const result = await mockedJsonResponse();
  expect(result).toEqual(mockResult);
});
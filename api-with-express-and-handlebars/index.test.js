#!/usr/bin/env ts-node

const request = require('supertest')
const app = require('../app') // Ensure correct path to your app file.

describe('App Server', () => {
  it('Should exist', () => {
    expect(app).toBeDefined()
  })

  it('GET / should return 200', async () => {
    const res = await request(app).get('/')
    expect(res.statusCode).toBe(200)
  })
  
  it('GET /non_existant_route should return 404', async () => {
    const res = await request(app).get('/non_existant_route')
    expect(res.statusCode).toBe(404)
  })
  
  it('Should serve static files', async () => {
    const res = await request(app).get('/public/test.html') // Change 'test.html' to your actual static file path.
    expect(res.statusCode).toBe(200)
  })
})
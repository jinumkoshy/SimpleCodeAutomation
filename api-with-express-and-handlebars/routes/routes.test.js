#!/usr/bin/env ts-node

const request = require('supertest');
const express = require('express');
const router = require('../routes'); // path to your router file
const appController = require('../controllers/appController');

const app = express();
app.use(router);

jest.mock('../controllers/appController');

describe('Routes', () => {
    test('GET /', async () => {
        appController.home.mockImplementation((req, res) => res.sendStatus(200));

        const response = await request(app).get('/');
        expect(response.status).toBe(200);
        expect(appController.home).toBeCalled();
    });
    
    test('GET /dependencies', async () => {
        appController.dependencies.mockImplementation((req, res) => res.sendStatus(200));

        const response = await request(app).get('/dependencies');
        expect(response.status).toBe(200);
        expect(appController.dependencies).toBeCalled();
    });

    test('GET /minimumSecure', async () => {
        appController.minimumSecurePage.mockImplementation((req, res) => res.sendStatus(200));

        const response = await request(app).get('/minimumSecure');
        expect(response.status).toBe(200);
        expect(appController.minimumSecurePage).toBeCalled();
    });

    test('GET /latestReleases', async () => {
        appController.latestReleasesPage.mockImplementation((req, res) => res.sendStatus(200));

        const response = await request(app).get('/latestReleases');
        expect(response.status).toBe(200);
        expect(appController.latestReleasesPage).toBeCalled();
    });

    test('GET /api/minimum-secure', async () => {
        appController.minimumSecure.mockImplementation((req, res) => res.sendStatus(200));

        const response = await request(app).get('/api/minimum-secure');
        expect(response.status).toBe(200);
        expect(appController.minimumSecure).toBeCalled();
    });

    test('GET /api/latest-releases', async () => {
        appController.latestReleases.mockImplementation((req, res) => res.sendStatus(200));

        const response = await request(app).get('/api/latest-releases');
        expect(response.status).toBe(200);
        expect(appController.latestReleases).toBeCalled();
    });
});
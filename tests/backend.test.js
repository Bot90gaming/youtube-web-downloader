const request = require('supertest');
const app = require('../server'); // Adjust path

describe('Backend Routes', () => {
    test('Health Check', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
    });
    test('Invalid URL', async () => {
        const res = await request(app).post('/info').send({ url: 'invalid' });
        expect(res.statusCode).toEqual(400);
    });
    // Add range header tests: mock fs, test 206 response
});
// Mock DOM or use jsdom for browser-like tests
describe('URL Validation', () => {
    test('Valid YouTube URL', () => {
        expect(validateURL('https://youtube.com/watch?v=123')).toBe(true);
    });
    test('Invalid URL', () => {
        expect(validateURL('invalid')).toBe(false);
    });
});
// Run: npx jest
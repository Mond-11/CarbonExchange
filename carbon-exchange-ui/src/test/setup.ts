import '@testing-library/jest-dom';

// Mock crypto.randomUUID for testing environment
if (!global.crypto) {
    // @ts-ignore
    global.crypto = {};
}
if (!global.crypto.randomUUID) {
    // @ts-ignore
    global.crypto.randomUUID = () => 'test-uuid';
}

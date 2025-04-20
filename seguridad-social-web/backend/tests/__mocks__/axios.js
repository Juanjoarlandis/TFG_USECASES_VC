/* eslint-disable no-undef */
const original = jest.requireActual('axios');
module.exports = {
    ...original,
    post: jest.fn(),
    get: jest.fn(),
    delete: jest.fn(),
};

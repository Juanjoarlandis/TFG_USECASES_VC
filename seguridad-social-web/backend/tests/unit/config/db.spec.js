// tests/unit/config/db.spec.js
jest.mock('mongoose');
const mongoose = require('mongoose');
const { connectDB } = require('../../../src/config/db');
const logger = require('../../../logger');

describe('config/db', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('conecta exitosamente a MongoDB', async () => {
        mongoose.connect.mockResolvedValueOnce();
        const spy = jest.spyOn(logger, 'info').mockImplementation();
        await connectDB();
        expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URI);
        expect(spy).toHaveBeenCalledWith('Conectado a MongoDB');
    });

    it('loggea y sale si falla la conexión', async () => {
        const error = new Error('fail');
        mongoose.connect.mockRejectedValueOnce(error);
        const spyErr = jest.spyOn(logger, 'error').mockImplementation();
        // Para capturar el process.exit
        const spyExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw 'EXIT'; });
        await expect(connectDB()).rejects.toBe('EXIT');
        expect(spyErr).toHaveBeenCalledWith('Error conectando a MongoDB:', error);
    });
});

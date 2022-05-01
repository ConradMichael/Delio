import { describe } from 'mocha';
import { expect } from 'chai';
import Stock from '../src/stock.model';
import nock from 'nock';

import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, disconnect } from 'mongoose';

describe('Our stock class', async () => {
    let mongod: any;
    
    beforeEach(async () => {
        mongod = await MongoMemoryServer.create();
        await connect(`${mongod.getUri()}stocks`);
    });

    const symbol = 'TEST';

    nock('https://finnhub.io/api/v1')
    .persist()
    .get(uri => uri.includes(symbol))
    .reply(200, {
        symbol,
        c: 2,
        pc: 1
    });

    it('should update the class values when initialised', async () => {
        const stock = new Stock(symbol);
        await stock.init();

        expect(stock.close).equal(2);
        expect(stock.prevClose).equal(1);
        expect(stock.symbol).equal(symbol);
    });

    it('should calculate the difference (profit or loss) of a stock', async () => {
        const stock = new Stock(symbol);
        await stock.init();

        const difference = await stock.difference();
        expect(difference).equal('10.00');
    });

    it('should return a description with the symbol, difference and type (Profit)', async () => {
        const stock = new Stock(symbol);
        await stock.init();

        const expected = {
            name: symbol,
            difference: '10.00',
            type: 'Profit'
        };

        const description = await stock.description();
        expect(description).deep.equal(expected);
    });

    afterEach(async () => {
        await disconnect();
        await mongod.stop();
    });
});

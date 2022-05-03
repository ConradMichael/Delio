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

    const PROF = 'PROF';

    nock('https://finnhub.io/api/v1')
    .persist()
    .get(uri => uri.includes(PROF))
    .reply(200, {
        PROF,
        c: 2,
        pc: 1
    });

    const LOSS = 'LOSS';

    nock('https://finnhub.io/api/v1')
    .persist()
    .get(uri => uri.includes(LOSS))
    .reply(200, {
        LOSS,
        c: 1,
        pc: 2
    });

    it('should update the class values when initialised', async () => {
        const stock = new Stock(PROF);
        await stock.init();

        expect(stock.close).equal(2);
        expect(stock.prevClose).equal(1);
        expect(stock.symbol).equal(PROF);
    });

    it('should calculate the difference of a stock (Profit)', async () => {
        const stock = new Stock(PROF);
        await stock.init();

        const difference = await stock.difference();
        expect(difference).equal('10.00');
    });

    it('should calculate the difference of a stock (Loss)', async () => {
        const stock = new Stock(LOSS);
        await stock.init();

        const difference = await stock.difference();
        expect(difference).equal('-10.00');
    });

    it('should return a description with the symbol, difference and type (Profit)', async () => {
        const stock = new Stock(PROF);
        await stock.init();

        const expected = {
            name: PROF,
            difference: '10.00',
            type: 'Profit'
        };

        const description = await stock.description();
        expect(description).deep.equal(expected);
    });

    it('should return a description with the symbol, difference and type (Loss)', async () => {
        const stock = new Stock(LOSS);
        await stock.init();

        const expected = {
            name: LOSS,
            difference: '-10.00',
            type: 'Loss'
        };

        const description = await stock.description();
        expect(description).deep.equal(expected);
    });

    afterEach(async () => {
        await disconnect();
        await mongod.stop();
    });
});

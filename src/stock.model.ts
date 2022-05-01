import FinnhubAPI, { Quote } from '@stoqey/finnhub';
import { Schema, model } from 'mongoose';

const quoteSchema = new Schema<Quote>({
    close: {
        type: Number,
        required: true
    },
    prevClose: {
        type: Number,
        required: true
    },
    symbol: {
        type: String,
        required: true
    }
});

const MQuote = model<Quote>('Stock', quoteSchema);

class Stock implements Quote {
    symbol!: string;
    close!: number;
    high!: number;
    low!: number;
    open!: number;
    prevClose!: number;
    date!: Date;
    units: number;

    constructor(symbol: string) {
        this.symbol = symbol;
        this.units = parseInt(`${process.env.DEFAULT_STOCK_UNITS}`);
    };

    async difference(): Promise<String> {
        const stock = await MQuote.findOne({ symbol: this.symbol });

        if (!stock) {
            throw new Error('Stock not found in Database');
        };

        return ((stock.close - stock.prevClose) * this.units).toFixed(2);
    };

    async description() {
        const difference = await this.difference();
        const type = difference.includes('-') ? 'Loss' : 'Profit';

        return {
            name: this.symbol,
            difference,
            type 
        };
    };

    async init() {
        const finnhubApi = new FinnhubAPI(process.env.FINNHUB_API_KEY);

        await finnhubApi.getQuote(this.symbol).then((response) => {
            this.symbol = response.symbol;
            this.close = response.close;
            this.prevClose = response.prevClose;
        });

        const mstock = new MQuote({
            prevClose: this.prevClose,
            close: this.close,
            symbol: this.symbol
        });

        await MQuote.deleteMany({
            symbol: this.symbol
        });

        await mstock.save();
    };
};

export default Stock;

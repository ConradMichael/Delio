import * as dotenv from 'dotenv';
import express, { Request, Response } from 'express';
import Stock from './stock.model';
import { connect, disconnect } from 'mongoose';

dotenv.config({path: `${__dirname}/../config/.env`});

const app = express();

const updateAllStocks = async (stocks: Array<string>) => Promise.all(
    stocks.map(async (stock) => {
        const newStock = new Stock(stock);
        await newStock.init();

        return await newStock.description();
    })
);

app.get('/api/v1/stocks', async (req: Request, res: Response) => {
    await connect(`${process.env.MONGODB_CONNECTION_STRING}`);

    const query = req.query || {};
    const stocks: Array<string> = query.stocks ? query.stocks.toString().split(',') : [];

    if (!stocks || stocks.length === 0) {
        return res.status(428).send('Invalid request - Please specify stocks with a comma delimited list: Example: ?stocks=AAPL,MSFT');
    };

    const differenceInStocks = await updateAllStocks(stocks);

    await disconnect();
    res.send(differenceInStocks);
});

app.listen(process.env.APP_PORT, (): void => {
    console.log(`App started on port: ${process.env.APP_PORT}`);
});

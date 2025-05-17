import express from 'express';
import dotenv from "dotenv";
import path from "path";
import bootstrap from './src/app.controller.js';
dotenv.config({ path: path.resolve(".env") });


const app = express();

const port = process.env.PORT || 3001


 bootstrap(app,express)


app.listen(port, () => console.log(`server listening on ${port}`));
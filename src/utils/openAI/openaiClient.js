import OpenAI  from "openai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({path:path.resolve(".env")});



export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
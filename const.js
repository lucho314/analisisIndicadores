//obtenemos las variables de entorno

import dotenv from 'dotenv';
dotenv.config();
// Definimos las variables de entorno


// const API_KEY = 
// const BYBIT_API_KEY = 'TU_API_KEY';
// const BYBIT_API_SECRET = 'TU_API_SECRET'; 

export const API_KEY = process.env.API_KEY || 'TU_API_KEY';
export const BYBIT_API_KEY = process.env.BYBIT_API_KEY || 'TU_BYBIT_API_KEY';
export const BYBIT_API_SECRET = process.env.BYBIT_API_SECRET || 'TU_BYBIT_API_SECRET';

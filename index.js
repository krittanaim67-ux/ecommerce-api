const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// นำเข้า Routes
const customersRouter = require('./routes/customers');
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');

// ใช้งาน Routes
app.use('/api/customers', customersRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);

// ส่งออก app สำหรับ Vercel
module.exports = app;
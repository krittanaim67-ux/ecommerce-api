const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const customersRoutes = require('./routes/customers');
const productsRoutes = require('./routes/products');
const ordersRoutes = require('./routes/orders');

app.use('/api/customers', customersRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/orders', ordersRoutes);

// Start server only when not in production (for Vercel compatibility)
if (process.env.NODE_ENV !== 'production') {
    const PORT = 3333;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    const { customer_id, items } = req.body;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction(); // เริ่ม Transaction

        let total = 0;
        
        // 1. เช็คสต๊อกและคำนวณราคารวม
        for (const item of items) {
            const [productRows] = await connection.query('SELECT price, stock FROM products WHERE id = ? FOR UPDATE', [item.product_id]);
            if (productRows.length === 0) throw new Error(`Product ID ${item.product_id} not found`);
            
            const product = productRows[0];
            if (product.stock < item.quantity) throw new Error(`Insufficient stock for Product ID ${item.product_id}`);
            
            total += parseFloat(product.price) * item.quantity;
        }

        // 2. สร้าง Order หลัก
        const [orderResult] = await connection.query(
            'INSERT INTO orders (customer_id, total) VALUES (?, ?)', 
            [customer_id, total]
        );
        const orderId = orderResult.insertId;

        // 3. หักสต๊อกและเพิ่มข้อมูลลง order_items
        for (const item of items) {
            const [productRows] = await connection.query('SELECT price FROM products WHERE id = ?', [item.product_id]);
            const price = productRows[0].price;

            await connection.query(
                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity, price]
            );

            await connection.query(
                'UPDATE products SET stock = stock - ? WHERE id = ?',
                [item.quantity, item.product_id]
            );
        }

        await connection.commit(); // สำเร็จ บันทึกฐานข้อมูล
        res.status(201).json({ message: 'Order created successfully', orderId, total });
    } catch (error) {
        await connection.rollback(); // มีปัญหา ยกเลิกทั้งหมด
        res.status(500).json({ error: error.message });
    } finally {
        connection.release();
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
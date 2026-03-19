const express = require('express');
const router = express.Router();
const pool = require('../db');

// 1. ดึงข้อมูลออเดอร์ทั้งหมด
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders ORDER BY id DESC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. ดึงข้อมูลออเดอร์ตาม ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. เพิ่มข้อมูล Order (ปรับให้รับข้อมูลจากหน้าเว็บที่เราทำ)
router.post('/', async (req, res) => {
    const { customer_id, total, status } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO orders (customer_id, total, status) VALUES (?, ?, ?)',
            [customer_id, total, status || 'placed']
        );
        res.status(201).json({ 
            message: 'Order created successfully', 
            id: result.insertId, 
            customer_id, 
            total, 
            status: status || 'placed' 
        });
    } catch (error) {
        // ถ้าขึ้น Error เรื่อง Foreign Key แปลว่าใส่ Customer ID ที่ไม่มีอยู่จริง
        res.status(500).json({ error: error.message });
    }
});

// 4. ลบข้อมูลออเดอร์
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
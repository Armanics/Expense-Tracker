const router = require('express').Router();
const Transaction = require('../models/Transaction');

router.get('/', async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        console.error('Unable to fetch transactions:', error);
        res.status(500).json({ error: 'Unable to fetch transactions.' });
    }
});

router.post('/', async (req, res) => {
    const { text, amount, type } = req.body;

    if (typeof text !== 'string' || !text.trim() || text.trim().length > 120) {
        return res.status(400).json({ error: 'Description must be between 1 and 120 characters.' });
    }

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Amount must be a positive number.' });
    }

    if (type !== 'income' && type !== 'expense') {
        return res.status(400).json({ error: 'Type must be income or expense.' });
    }

    try {
        const transaction = await Transaction.create({ text: text.trim(), amount, type });
        res.status(201).json(transaction);
    } catch (error) {
        console.error('Unable to create transaction:', error);
        res.status(400).json({ error: 'Unable to create transaction.' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const transaction = await Transaction.findByIdAndDelete(req.params.id);
        if (!transaction) {
            return res.status(404).json({ error: 'Transaction not found.' });
        }
        res.json({ success: true });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ error: 'Invalid transaction ID.' });
        }
        console.error('Unable to delete transaction:', error);
        res.status(500).json({ error: 'Unable to delete transaction.' });
    }
});

module.exports = router;
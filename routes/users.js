const express = require('express');
const router = express.Router();
const User = require('../models/user');

// ...existing code...

// Edit user route
router.post('/edit/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const fee = parseFloat(req.body.fee);
        if (isNaN(fee)) {
            return res.status(400).json({ success: false, message: 'Invalid fee value' });
        }
        user.fee = fee;
        await user.save();
        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ...existing code...

module.exports = router;

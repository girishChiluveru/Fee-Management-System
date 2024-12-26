const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/users/login', (req, res) => {
    res.render('login');
});

router.get('/users/register', (req, res) => {
    res.render('register');
});
router.post('/users/delete/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/');
    } catch (err) {
        res.status(500).send(err);
    }
});

// ...existing code...

module.exports = router;

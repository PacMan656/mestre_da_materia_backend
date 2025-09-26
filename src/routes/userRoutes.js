
const express = require('express');
const router = express.Router();
const userController = require('../../controllers/userController');
const verifyToken = require('../middleware/authMiddleware');

router.get('/users', verifyToken, userController.getUsers);
router.post('/users', userController.createUser);

module.exports = router;
    
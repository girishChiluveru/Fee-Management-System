const express = require('express');
const app = express();
const usersRouter = require('./routes/users');

// ...existing code...

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Use the users router
app.use('/user', usersRouter);

// ...existing code...

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});

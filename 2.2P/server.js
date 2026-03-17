const express = require('express');
const app = express();
const port = 3000;

app.use(express.static('public'));


app.get('/add', (req, res) => {
    const num1 = parseFloat(req.query.num1);
    const num2 = parseFloat(req.query.num2);

    if (isNaN(num1) || isNaN(num2)) {
        return res.status(400).send('Invalid numbers provided');
    }

    const result = num1 + num2;
    res.send(`The sum of ${num1} and ${num2} is: ${result}`);
});


app.get('/sub', (req, res) => {
    const num1 = parseFloat(req.query.num1);
    const num2 = parseFloat(req.query.num2);

    if (isNaN(num1) || isNaN(num2)) {
        return res.status(400).send('Invalid numbers provided');
    }

    const result = num1 - num2;
    res.send(`The difference between ${num1} and ${num2} is: ${result}`);
});


app.get('/mul', (req, res) => {
    const num1 = parseFloat(req.query.num1);
    const num2 = parseFloat(req.query.num2);

    if (isNaN(num1) || isNaN(num2)) {
        return res.status(400).send('Invalid numbers provided');
    }

    const result = num1 * num2;
    res.send(`The product of ${num1} and ${num2} is: ${result}`);
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

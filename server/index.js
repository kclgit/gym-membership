const express = require('express');
const path = require('path');

const app = express();

const publicPath = path.join(__dirname, '..', 'public');

app.use(express.static(publicPath));

app.listen(3000, '0.0.0.0', () => {
    console.log('Server is active on port 3000');
});

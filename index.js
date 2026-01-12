const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World from pnpm on Cloud Foundry!');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

import express from 'express'




const app = express();

app.get('/', (req, res) => {
    res.status(200).send('<h1>Server is running</h1>')
})

app.get('*', (req, res) => {
    res.status(200).send('<h1>404 not found</h1>')
})


app.listen(5000, () => {
    console.log('server is running at ' + 5000)
})
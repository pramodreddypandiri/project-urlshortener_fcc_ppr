require('dotenv').config();
const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const cors = require('cors');
const dns = require('dns');
const app = express();
const shortId = require('shortid')
//connection to database
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
//error handling in DB connecions
const connection = mongoose.connection;
connection.on('error', console.error.bind(console, 'connection error'))
connection.once('open', () => {
  console.log("Database successfully connected")
})
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});
const Schema = mongoose.Schema;
const linkSchema = new Schema({
  originalUrl: {
    type: String,
    required: true,
  },
  shortUrl: {
    type: String,
    required: true,
  },
})
const link = mongoose.model('link', linkSchema);
function isValidURL(url) {
  const urlParts = new URL(url);
  const hostname = urlParts.hostname;

  return new Promise((resolve) => {
    dns.lookup(hostname, (err) => {
      if (err) {
        resolve(false); // URL is not valid
      } else {
        resolve(true); // URL is valid
      }
    });
  });
}
//post request to /api/shorturl
app.post('/api/shorturl', async function(req, res){
  console.log(req.body);
  const url = req.body.url;
  console.log("url", url);
  const urlCode = shortId.generate();
  const isValid = await isValidURL(url);

  if (!isValid) {
    return res.json({ error: 'invalid url' });
  }
  const newUrl = new link({
        originalUrl : url,
      shortUrl: urlCode
    })
  newUrl.save()
  res.json({original_url:newUrl.originalUrl, short_url:newUrl.shortUrl})

  
})
//get request to fetch original url based on short url
app.get('/api/shorturl/:short_url', async function(req, res){
  const short_url = req.params.short_url;
  console.log("short_url", short_url);
  const urlParams = await link.findOne({
    shortUrl: short_url
  })
  if(urlParams){
    return res.redirect(urlParams.originalUrl)
  }else{
    return res.json('URL not Found')
  }

})
app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

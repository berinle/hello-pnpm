const express = require('express');
const bodyParser = require('body-parser');
const Redis = require('ioredis');
const { formatDistanceToNow } = require('date-fns');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Redis Connection
let redis;

if (process.env.VCAP_SERVICES) {
  // Cloud Foundry Configuration
  try {
    const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
    
    // Find a service that looks like Redis
    let redisService;

    // 1. Try known platform service labels
    redisService = vcapServices['p-redis']?.[0] || vcapServices['redis']?.[0];

    // 2. If not found, look for user-provided services with typical Redis credentials
    if (!redisService && vcapServices['user-provided']) {
      redisService = vcapServices['user-provided'].find(service => 
        service.credentials && (service.credentials.host || service.credentials.hostname) && service.credentials.port
      );
    }

    if (redisService) {
      const creds = redisService.credentials;
      redis = new Redis({
        host: creds.host || creds.hostname,
        port: creds.port,
        password: creds.password,
        tls: creds.tls // Some providers require TLS
      });
      console.log(`Connected to Redis Service: ${redisService.name} (Type: ${redisService.label || 'user-provided'})`);
    } else {
      console.error('No suitable Redis service found in VCAP_SERVICES');
    }
  } catch (err) {
    console.error('Error parsing VCAP_SERVICES:', err);
  }
} 

// Fallback to local Redis if not on CF or connection failed
if (!redis) {
  redis = new Redis(); // Defaults to localhost:6379
  console.log('Connected to Local Redis');
}

redis.on('error', (err) => {
  console.error('Redis Error:', err);
});

// Routes

app.get('/', async (req, res) => {
  try {
    // 1. Log Visitor
    const userAgent = req.get('User-Agent') || 'Unknown';
    // Handle X-Forwarded-For if behind proxy/CF
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    
    const visitorData = JSON.stringify({
      userAgent,
      ip,
      timestamp: new Date().toISOString()
    });

    // Push to list and trim to keep only last 10
    await redis.lpush('visitors', visitorData);
    await redis.ltrim('visitors', 0, 9);

    // 2. Fetch Visitors
    const rawVisitors = await redis.lrange('visitors', 0, -1);
    const visitors = rawVisitors.map(v => {
      const data = JSON.parse(v);
      return {
        ...data,
        time: formatDistanceToNow(new Date(data.timestamp), { addSuffix: true })
      };
    });

    // 3. Fetch Ephemeral Messages
    // We scan keys starting with 'msg:' to find active messages
    // In production, you might use a Set to track these keys for better performance
    const keys = await redis.keys('msg:*');
    const messages = [];

    for (const key of keys) {
      const text = await redis.get(key);
      const ttl = await redis.ttl(key);
      if (text) {
        messages.push({ text, ttl });
      }
    }

    // Sort messages by TTL (expiring soonest first)
    messages.sort((a, b) => a.ttl - b.ttl);

    res.render('index', { visitors, messages });

  } catch (err) {
    console.error('Error rendering page:', err);
    res.status(500).send('Internal Server Error - Check logs');
  }
});

app.post('/message', async (req, res) => {
  const { message } = req.body;
  if (message && message.trim().length > 0) {
    const id = Date.now().toString();
    // Set key with 60 second expiration
    await redis.set(`msg:${id}`, message.trim(), 'EX', 60);
  }
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});

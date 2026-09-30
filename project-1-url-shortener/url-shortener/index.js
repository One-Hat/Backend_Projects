const express = require('express');
const crypto = require('crypto');// this is a built in node module that allows us to generate random strings
const z = require('zod'); // this is a schema validation library - mtaches correct data formtas (int , char etc)
const cors = require('cors'); // this is a middleware that allows us to enable CORS (Cross-Origin Resource Sharing) for our API. This is useful for allowing our API to be accessed from different domains.
const { rateLimiter } = require('./rateLimiter');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Data Store (in-memory mock databse)

const db = new Map(); // this is a built in data structure that allows us to store key value pairs
const generateShortCode = (length = 6) => {
    return crypto.randomBytes(length).toString("base64url").slice(0, length); // this generates a random string of 6 characters that we will use as the short code for our URL  
} // this generates a random string of 6 characters that we will use as the short code for our URL
// Zod - validation Schema
const createUrlSchema = z.object({
    body: z.object({
        originalUrl : z.string({required_error: "URL IS NEEDED!"}).url("Must be a valid URL! (e.g https://example.com)"),
        customCode: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, "Custom code must only contain letters, numbers, hyphens, and underscores").optional(),
        expiresInHours: z.number().positive().max(8760).optional(),
    }),
});

const validate = (schema) => (req, res, next) => {
    const result = schema.safeParse({
        body: req.body,
        query: req.query,
        params: req.params,
    });
    if (!result.success) {
        return res.status(400).json({
            error: result.error.flatten().fieldErrors,
        });
    }
    req.body = result.data.body;
    next();
};

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'url-shortener', timestamp: new Date().toISOString() });
});

// Route Handlers
app.post('/api/shorten', rateLimiter({ maxRequests: 100 }), validate(createUrlSchema), (req, res) => {
    const { originalUrl, customCode, expiresInHours } = req.body;

    let shortCode = customCode;
    if (shortCode) {
        if (db.has(shortCode)) {
            return res.status(409).json({ error: "Custom short code already in use! Please choose another." });
        }
    } else {
        shortCode = generateShortCode(6);
    }

    const now = new Date();
    const expiresAt = expiresInHours ? new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString() : null;

    const record = {
        id: shortCode,
        originalUrl,
        clicks: 0,
        createdAt: now.toISOString(),
        expiresAt,
    };
    db.set(shortCode, record);

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    return res.status(201).json({
        status: "success",
        data: {
            shortCode,
            shortUrl: `${baseUrl}/${shortCode}`,
            originalUrl,
            expiresAt,
        },
    });    
});

// View click count & analytics
app.get('/api/stats/:code', (req, res) => {
    const { code } = req.params;
    const record = db.get(code);

    if (!record) {
        return res.status(404).json({ error: "Short URL not found!" });
    }
    return res.status(200).json({
        status: "success",
        data: record,
    });
});    

// Redirect to original url
app.get('/:code', (req, res) => {
    const { code } = req.params;
    const record = db.get(code);

    if (!record) {
        return res.status(404).json({ error: "Short URL not found!" });
    }

    // Check expiration
    if (record.expiresAt && new Date() > new Date(record.expiresAt)) {
        return res.status(410).json({ error: "This short link has expired." });
    }

    record.clicks++;
    return res.redirect(302, record.originalUrl);
}); 

 // lets build the server listener

 app.listen(3000, ()=>{
    console.log("Server is running on port 3000");
 });
// Simple, zero-dependency in-memory sliding window rate limiter
const rateLimitMap = new Map();

function rateLimiter({ windowMs = 60 * 1000, maxRequests = 60, message = 'Too many requests, please try again later.' } = {}) {
  // Cleanup old entries every 5 minutes to avoid memory leaks
  setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimitMap.entries()) {
      if (now - data.startTime > windowMs * 2) {
        rateLimitMap.delete(key);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, { count: 1, startTime: now });
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }

    const clientData = rateLimitMap.get(ip);

    if (now - clientData.startTime < windowMs) {
      clientData.count++;
      const remaining = Math.max(0, maxRequests - clientData.count);
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', remaining);

      if (clientData.count > maxRequests) {
        res.setHeader('Retry-After', Math.ceil((windowMs - (now - clientData.startTime)) / 1000));
        return res.status(429).json({ error: message });
      }
      return next();
    } else {
      // Reset window
      clientData.count = 1;
      clientData.startTime = now;
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', maxRequests - 1);
      return next();
    }
  };
}

module.exports = { rateLimiter };

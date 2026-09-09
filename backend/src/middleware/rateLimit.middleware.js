const requests = new Map();

export const rateLimit = ({ windowMs = 60_000, max = 100 } = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const entry = requests.get(key);

    if (!entry || now - entry.startedAt >= windowMs) {
      requests.set(key, { startedAt: now, count: 1 });
      return next();
    }

    entry.count += 1;

    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((windowMs - (now - entry.startedAt)) / 1000)));
      return res.status(429).json({
        success: false,
        message: "Too many requests",
      });
    }

    next();
  };
};

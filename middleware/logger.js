// Logs each incoming request with a readable timestamp, method, and URL.
module.exports = function logger(req, _res, next) {
  const timestamp = new Date().toLocaleString(); 
  console.log(
    `[${timestamp}] Someone just made a ${req.method} request to "${req.originalUrl}"`
  );
  next();
};

// Logs each incoming request with a readable timestamp, method, and URL.
module.exports = function logger(req, _res, next) {
  const timestamp = new Date().toLocaleString(); 
  console.log(`${req.method} request to ${req.url} at ${timestamp}`);
  next();
};

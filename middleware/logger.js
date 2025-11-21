// Logs each incoming request with a readable timestamp, method, and URL.
module.exports = function logger(req, _res, next) {
  const timestamp = new Date().toLocaleString(); 
  
  console.log(`${method} request to ${url} at ${timestamp}`);
  next();
};

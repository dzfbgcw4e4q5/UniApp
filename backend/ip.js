// Get IP from environment variable or use default
const IP = process.env.SERVER_IP || '10.144.48.20';
console.log(`Server using IP: ${IP}`);
module.exports = IP;
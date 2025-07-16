// Get IP from environment variable or use default
const IP = process.env.SERVER_IP || '192.168.29.128';
console.log(`Server using IP: ${IP}`);
module.exports = IP;
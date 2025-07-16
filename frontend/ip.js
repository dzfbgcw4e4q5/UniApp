// Export the server IP address
export const IP = '192.168.29.128';
console.log(`App connecting to server at: ${IP}`);

// Add a function to test the connection to the server
export const testServerConnection = async () => {
  try {
    const response = await fetch(`http://${IP}:3000/api/test`);
    const data = await response.json();
    console.log('Server connection test result:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Server connection test failed:', error.message);
    return { success: false, error: error.message };
  }
};
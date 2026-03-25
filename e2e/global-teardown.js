// global-teardown.js
module.exports = async () => {
  console.log('[Global Teardown] Stopping AI Team Office server...');
  
  if (global.__SERVER__) {
    global.__SERVER__.kill();
    console.log('[Global Teardown] Server stopped');
  }
};

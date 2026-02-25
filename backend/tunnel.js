const ngrok = require('ngrok');

(async () => {
  try {
    // Create tunnels for both frontend and backend
    const frontendUrl = await ngrok.connect(5173);
    const backendUrl = await ngrok.connect(4000);
    
    console.log('\n=== NGROK TUNNELS CREATED ===\n');
    console.log(`Frontend: ${frontendUrl}`);
    console.log(`Backend:  ${backendUrl}`);
    console.log('\n================================\n');
    console.log('Share these URLs with external devices.');
    console.log('Ctrl+C to stop tunnels.\n');
    
    // Keep tunnels alive
    process.stdin.resume();
  } catch (error) {
    console.error('Tunnel error:', error.message);
    process.exit(1);
  }
})();

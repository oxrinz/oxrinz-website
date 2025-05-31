const WebSocket = require('ws');
const http = require('http');
const url = require('url');

// Create HTTP server
const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Map();
let masterClient = null;
let clientCounter = 1;

function generateClientId() {
  return `client_${clientCounter++}`;
}

function broadcastToMaster(data) {
  if (masterClient && masterClient.readyState === WebSocket.OPEN) {
    masterClient.send(JSON.stringify(data));
  }
}

function sendToClient(clientId, data) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(data));
  }
}

function updateMasterWithClients() {
  if (!masterClient) return;
  
  const clientsList = Array.from(clients.values()).map(client => ({
    id: client.id,
    name: client.name,
    lastSeen: client.lastSeen,
    unreadCount: client.unreadCount || 0
  }));
  
  broadcastToMaster({
    type: 'clients_update',
    clients: clientsList
  });
}

wss.on('connection', (ws, req) => {
  const query = url.parse(req.url, true).query;
  const role = query.role || 'client';
  
  console.log(`New ${role} connected`);
  
  if (role === 'master') {
    // Handle master client
    if (masterClient) {
      // Close existing master connection
      masterClient.close();
    }
    
    masterClient = ws;
    
    ws.send(JSON.stringify({
      type: 'welcome',
      role: 'master',
      clientId: 'master'
    }));
    
    // Send current clients list
    updateMasterWithClients();
    
  } else {
    // Handle regular client
    const clientId = generateClientId();
    const clientName = `Client ${clientCounter - 1}`;
    
    const clientData = {
      id: clientId,
      name: clientName,
      ws: ws,
      role: 'client',
      lastSeen: new Date(),
      unreadCount: 0
    };
    
    clients.set(clientId, clientData);
    
    ws.send(JSON.stringify({
      type: 'welcome',
      role: 'client',
      clientId: clientId,
      clientName: clientName
    }));
    
    // Send welcome message from master
    ws.send(JSON.stringify({
      type: 'message',
      content: "Welcome! You're now connected to our support chat. How can we help you today?",
      role: 'master',
      timestamp: new Date().toISOString()
    }));
    
    // Update master with new client list
    updateMasterWithClients();
    
    // Notify master about new client
    broadcastToMaster({
      type: 'message',
      content: `${clientName} has joined the chat`,
      role: 'system',
      clientId: clientId,
      clientName: clientName,
      timestamp: new Date().toISOString()
    });
  }
  
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message);
      
      switch (message.type) {
        case 'message':
          if (ws === masterClient) {
            // Master sending message to client
            const targetClientId = message.clientId;
            if (targetClientId) {
              sendToClient(targetClientId, {
                type: 'message',
                content: message.content,
                role: 'master',
                timestamp: message.timestamp
              });
              
              console.log(`Master sent message to ${targetClientId}`);
            }
          } else {
            // Client sending message to master
            const client = Array.from(clients.values()).find(c => c.ws === ws);
            if (client) {
              client.lastSeen = new Date();
              
              // Forward to master
              broadcastToMaster({
                type: 'message',
                content: message.content,
                role: 'client',
                clientId: client.id,
                clientName: client.name,
                timestamp: message.timestamp
              });
              
              // Update clients list for master
              updateMasterWithClients();
              
              console.log(`${client.name} sent message to master`);
            }
          }
          break;
          
        case 'typing':
          if (ws === masterClient) {
            // Master typing to client
            if (message.clientId) {
              sendToClient(message.clientId, {
                type: 'typing',
                isTyping: message.isTyping
              });
            }
          } else {
            // Client typing to master
            const client = Array.from(clients.values()).find(c => c.ws === ws);
            if (client) {
              broadcastToMaster({
                type: 'typing',
                isTyping: message.isTyping,
                clientId: client.id,
                clientName: client.name
              });
            }
          }
          break;
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  ws.on('close', () => {
    if (ws === masterClient) {
      console.log('Master client disconnected');
      masterClient = null;
    } else {
      // Find and remove the client
      const clientToRemove = Array.from(clients.entries()).find(([id, client]) => client.ws === ws);
      if (clientToRemove) {
        const [clientId, client] = clientToRemove;
        clients.delete(clientId);
        console.log(`${client.name} disconnected`);
        
        // Notify master about client leaving
        broadcastToMaster({
          type: 'message',
          content: `${client.name} has left the chat`,
          role: 'system',
          clientId: clientId,
          clientName: client.name,
          timestamp: new Date().toISOString()
        });
        
        // Update master with new client list
        updateMasterWithClients();
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

const PORT = 8081;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Master client: ws://localhost:${PORT}?role=master`);
  console.log(`Regular clients: ws://localhost:${PORT}?role=client`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  wss.close(() => {
    server.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});
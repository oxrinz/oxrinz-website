<script>
    import { onMount, onDestroy, tick } from 'svelte';
    
    let messages = [];
    let currentMessage = '';
    let isTyping = false;
    let messagesContainer;
    let messageId = 1;
    let ws = null;
    let connectionStatus = 'connecting';
    let clientId = null;
    let isMaster = true;
    let connectedClients = [];
    let selectedClient = null;
    let typingClients = {};
    let typingTimeout;
    
    let showRoleSelector = true;
    let wsUrl = 'ws://localhost:8080/ws';
    
    async function scrollToBottom() {
      await tick();
      if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
    
    function connectWebSocket(role) {
      try {
        ws = new WebSocket(`${wsUrl}?role=${role}`);
        ws.onopen = () => {
          connectionStatus = 'connected';
          console.log('Connected to WebSocket server');
        };
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        };
        ws.onclose = () => {
          connectionStatus = 'disconnected';
          console.log('Disconnected from WebSocket server');
          setTimeout(() => {
            if (connectionStatus === 'disconnected') {
              connectWebSocket(isMaster ? 'master' : 'client');
            }
          }, 3000);
        };
        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          connectionStatus = 'error';
        };
      } catch (error) {
        console.error('Failed to connect:', error);
        connectionStatus = 'error';
      }
    }
    
    function handleWebSocketMessage(data) {
      switch (data.type) {
        case 'welcome':
          clientId = data.clientId;
          isMaster = data.role === 'master';
          if (!isMaster) {
            messages = [{
              id: messageId++,
              content: "Hello. Prove that you're a human.",
              role: 'master',
              timestamp: new Date()
            }];
          }
          break;
          
        case 'clients_update':
          if (isMaster) {
            console.log('Received clients_update:', data.clients);
            connectedClients = data.clients;
            if (selectedClient && !connectedClients.find(c => c.id === selectedClient.id)) {
              selectedClient = null;
            }
            if (!selectedClient && connectedClients.length > 0) {
              selectedClient = connectedClients[0];
            }
          }
          break;
          
        case 'message':
          const newMessage = {
            id: messageId++,
            content: data.content,
            role: data.role,
            clientId: data.clientId,
            clientName: data.clientName,
            timestamp: new Date(data.timestamp)
          };
          if (isMaster) {
            const client = connectedClients.find(c => c.id === data.clientId);
            if (client && data.clientId !== selectedClient?.id && data.role === 'client') {
              client.unreadCount = (client.unreadCount || 0) + 1;
              connectedClients = [...connectedClients];
            }
          }
          messages = [...messages, newMessage];
          scrollToBottom();
          break;
          
        case 'typing':
          if (isMaster) {
            typingClients[data.clientId] = data.isTyping;
            typingClients = { ...typingClients };
          } else {
            isTyping = data.isTyping;
          }
          scrollToBottom();
          break;
      }
    }
    
    
    function selectClient(client) {
      selectedClient = client;
      client.unreadCount = 0;
      connectedClients = [...connectedClients];
      console.log('Selected client ID:', client.id);
    }
    
    function sendMessage() {
      if (!currentMessage.trim() || connectionStatus !== 'connected') return;
      if (isMaster && !selectedClient) {
        console.error('No client selected');
        return;
      }
      const messageData = {
        type: 'message',
        content: currentMessage.trim(),
        role: isMaster ? 'master' : 'client',
        clientId: isMaster ? selectedClient.id : clientId,
        timestamp: new Date().toISOString()
      };
      console.log('Sending message:', messageData);
      messages = [...messages, {
        id: messageId++,
        content: currentMessage.trim(),
        role: isMaster ? 'master' : 'client',
        clientId: isMaster ? selectedClient.id : clientId,
        timestamp: new Date()
      }];
      currentMessage = '';
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(messageData));
        sendTyping(false);
      }
      scrollToBottom();
    }
    
    function sendTyping(isTyping) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        const typingData = {
          type: 'typing',
          isTyping: isTyping,
          role: isMaster ? 'master' : 'client',
          clientId: isMaster ? selectedClient?.id : clientId,
        };
        ws.send(JSON.stringify(typingData));
      }
    }
    
    function handleInput() {
      if (connectionStatus !== 'connected' || (isMaster && !selectedClient)) return;
      sendTyping(true);
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        sendTyping(false);
      }, 2000);
    }
    
    function handleKeyPress(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    }
    
    function getConnectionStatusColor() {
      switch (connectionStatus) {
        case 'connected': return 'bg-green-500';
        case 'connecting': return 'bg-yellow-500';
        case 'disconnected': return 'bg-red-500';
        default: return 'bg-neutral-500';
      }
    }
    
    $: filteredMessages = isMaster && selectedClient 
      ? messages.filter(msg => 
          (msg.role === 'master' && msg.clientId === selectedClient.id) ||
          (msg.role === 'client' && msg.clientId === selectedClient.id)
        )
      : messages;
    
    onMount(() => {
      connectWebSocket("master");
      scrollToBottom();
    });
    
    onDestroy(() => {
      if (ws) {
        ws.close();
      }
    });
  </script>
  
    <div class="flex h-screen bg-neutral-900">
      {#if isMaster}
        <div class="w-80 bg-neutral-800 border-r border-neutral-700 flex flex-col">
          <div class="p-4 border-b border-neutral-700">
            <h2 class="text-lg font-semibold text-neutral-100">Connected Clients</h2>
            <div class="flex items-center gap-2 mt-2">
              <div class="w-2 h-2 rounded-full {getConnectionStatusColor()}"></div>
              <span class="text-sm text-neutral-400 capitalize">{connectionStatus}</span>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto">
            {#each connectedClients as client (client.id)}
              <button
                on:click={() => selectClient(client)}
                class="w-full p-4 text-left hover:bg-neutral-700 border-b border-neutral-700 transition-colors {
                  selectedClient?.id === client.id ? 'bg-neutral-700 border-l-4 border-l-rose-500' : ''
                }"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium text-neutral-100">{client.name}</div>
                  </div>
                  {#if client.unreadCount > 0}
                    <div class="bg-rose-500 text-white text-xs rounded-full px-2 py-1 min-w-5 text-center">
                      {client.unreadCount}
                    </div>
                  {/if}
                </div>
              </button>
            {/each}
          </div>
        </div>
      {/if}
  
      <div class="flex flex-col flex-1 max-w-4xl {isMaster ? '' : 'mx-auto'} bg-neutral-800">
        <header class="flex-shrink-0 bg-neutral-900 border-b border-neutral-700 p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-gradient-to-br from-rose-500 to-rose-600 rounded-full flex items-center justify-center text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L13.09 6.26L18 7L13.09 7.74L12 12L10.91 7.74L6 7L10.91 6.26L12 2Z" fill="currentColor"/>
                    <path d="M19 15L20.09 17.26L23 18L20.09 18.74L19 21L17.91 18.74L15 18L17.91 17.26L19 15Z" fill="currentColor"/>
                    <path d="M5 9L6.09 11.26L9 12L6.09 12.74L5 15L3.91 12.74L1 12L3.91 11.26L5 9Z" fill="currentColor"/>
                  </svg>
                </div>
              </div>
              <div>
                <h1 class="text-lg font-semibold text-neutral-100 m-0">
                  {isMaster ? 'Master Dashboard' : 'HumanCaptcha'}
                </h1>
                <p class="text-sm text-neutral-400 m-0">
                  {isMaster ? `Chatting with ${selectedClient?.name || 'No client selected'}` : 'Connected to support'}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full {getConnectionStatusColor()}"></div>
              <span class="text-sm text-neutral-400 capitalize">{connectionStatus}</span>
            </div>
          </div>
        </header>
  
        <div class="flex-1 overflow-y-auto bg-neutral-800" bind:this={messagesContainer}>
          <div class="p-4 flex flex-col gap-4 min-h-full">
            {#if isMaster && !selectedClient}
              <div class="flex items-center justify-center h-full text-neutral-400">
                <div class="text-center">
                  <div class="text-lg mb-2">No client selected</div>
                  <div class="text-sm">Select a client from the sidebar to start chatting</div>
                </div>
              </div>
            {:else}
              {#each filteredMessages as message (message.id)}
                <div class="flex w-full {
                  (isMaster && message.role === 'master') || (!isMaster && message.role === 'client')
                    ? 'justify-end'
                    : 'justify-start'
                }">
                  <div class="max-w-[70%] px-4 py-3 rounded-2xl {
                    (isMaster && message.role === 'master') || (!isMaster && message.role === 'client')
                      ? 'bg-rose-500 text-white rounded-br-sm'
                      : 'bg-neutral-500 text-white rounded-bl-sm'
                  }">
                    <div class="leading-relaxed break-words">
                      {message.content}
                    </div>
                  </div>
                </div>
              {/each}
              
              {#if isMaster && selectedClient && typingClients[selectedClient.id]}
                <div class="flex justify-start">
                  <div class="bg-neutral-700 text-neutral-100 rounded-2xl rounded-bl-sm p-4">
                    <div class="flex items-center gap-1">
                      <div class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
                      <div class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                      <div class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 0.4s;"></div>
                    </div>
                  </div>
                </div>
              {:else if !isMaster && isTyping}
                <div class="flex justify-start">
                  <div class="bg-neutral-700 text-neutral-100 rounded-2xl rounded-bl-sm p-4">
                    <div class="flex items-center gap-1">
                      <div class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 0s;"></div>
                      <div class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 0.2s;"></div>
                      <div class="w-2 h-2 bg-neutral-400 rounded-full animate-bounce" style="animation-delay: 0.4s;"></div>
                    </div>
                  </div>
                </div>
              {/if}
            {/if}
          </div>
        </div>
  
        {#if (!isMaster || selectedClient) && connectionStatus === 'connected'}
          <div class="flex-shrink-0 p-4 bg-neutral-800 border-t border-neutral-700">
            <div class="flex items-end gap-3 bg-neutral-700 rounded-xl p-3 border border-neutral-600 focus-within:border-rose-500 transition-colors">
              <textarea
                bind:value={currentMessage}
                on:keydown={handleKeyPress}
                on:input={handleInput}
                placeholder={isMaster ? `Message ${selectedClient?.name}...` : "Type your message..."}
                rows="1"
                class="flex-1 bg-transparent border-none outline-none text-neutral-100 text-base leading-6 resize-none max-h-32 min-h-6 placeholder-neutral-400"
              ></textarea>
              <button
                on:click={sendMessage}
                disabled={!currentMessage.trim()}
                class="bg-rose-500 hover:bg-rose-600 disabled:bg-neutral-600 disabled:cursor-not-allowed border-none rounded-md p-2 text-white cursor-pointer flex items-center justify-center transition-all duration-200 hover:enabled:-translate-y-0.5 flex-shrink-0"
                aria-label="Send message"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z" fill="currentColor"/>
                </svg>
              </button>
            </div>
          </div>
        {/if}
      </div>
    </div>

  <style>
    .overflow-y-auto::-webkit-scrollbar {
      width: 6px;
    }
  
    .overflow-y-auto::-webkit-scrollbar-track {
      background: #1f2937;
    }
  
    .overflow-y-auto::-webkit-scrollbar-thumb {
      background: #4b5563;
      border-radius: 3px;
    }
  
    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background: #6b7280;
    }
  
    .animate-bounce {
      animation: bounce 1s infinite;
    }
  
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  </style>
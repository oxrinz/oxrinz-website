package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development; restrict in production
	},
}

// Response struct for API responses
type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Client represents a connected client
type Client struct {
	id          string
	name        string
	conn        *websocket.Conn
	role        string
	send        chan []byte
	lastSeen    time.Time
	isTyping    bool
	unreadCount int
}

// Message represents a chat message
type Message struct {
	Type       string    `json:"type"`
	Content    string    `json:"content,omitempty"`
	Role       string    `json:"role"`
	ClientID   string    `json:"clientId"`
	ClientName string    `json:"clientName"`
	Timestamp  time.Time `json:"timestamp"`
	IsTyping   bool      `json:"isTyping,omitempty"`
}

// Hub manages all clients and their connections
type Hub struct {
	clients    map[string]*Client
	master     *Client
	broadcast  chan []byte
	register   chan *Client
	unregister chan *Client
	mutex      sync.RWMutex
}

func newHub() *Hub {
	return &Hub{
		clients:    make(map[string]*Client),
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
	}
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mutex.Lock()
			if client.role == "master" {
				h.master = client
			} else {
				client.name = fmt.Sprintf("Client %d", len(h.clients)+1)
				h.clients[client.id] = client
			}
			h.mutex.Unlock()
			h.notifyMasterClientsUpdate()
			h.sendWelcomeMessage(client)

		case client := <-h.unregister:
			h.mutex.Lock()
			if client.role == "master" {
				h.master = nil
			} else {
				delete(h.clients, client.id)
			}
			h.mutex.Unlock()
			close(client.send)
			h.notifyMasterClientsUpdate()

		case message := <-h.broadcast:
			var msg Message
			if err := json.Unmarshal(message, &msg); err != nil {
				log.Printf("Error unmarshaling message: %v", err)
				continue
			}

			h.mutex.RLock()
			if msg.Type == "message" {
				if msg.Role == "master" && msg.ClientID != "" {
					if client, exists := h.clients[msg.ClientID]; exists {
						select {
						case client.send <- message:
						default:
							log.Printf("Client %s send channel full", client.id)
						}
					}
				} else if msg.Role == "client" && h.master != nil {
					if client, exists := h.clients[msg.ClientID]; exists {
						client.unreadCount++
					}
					select {
					case h.master.send <- message:
					default:
						log.Printf("Master send channel full")
					}
				}
			} else if msg.Type == "typing" {
				if msg.Role == "client" && h.master != nil {
					select {
					case h.master.send <- message:
					default:
						log.Printf("Master send channel full")
					}
				} else if msg.Role == "master" && msg.ClientID != "" {
					if client, exists := h.clients[msg.ClientID]; exists {
						select {
						case client.send <- message:
						default:
							log.Printf("Client %s send channel full", client.id)
						}
					}
				}
			}
			h.mutex.RUnlock()
		}
	}
}

func (h *Hub) sendWelcomeMessage(client *Client) {
	welcome := Message{
		Type:      "welcome",
		ClientID:  client.id,
		Role:      client.role,
		Timestamp: time.Now(),
	}
	data, _ := json.Marshal(welcome)
	client.send <- data
}

func (h *Hub) notifyMasterClientsUpdate() {
	if h.master == nil {
		return
	}

	h.mutex.RLock()
	clients := make([]struct {
		ID          string    `json:"id"`
		Name        string    `json:"name"`
		LastSeen    time.Time `json:"lastSeen"`
		UnreadCount int       `json:"unreadCount"`
	}, 0, len(h.clients))

	for _, client := range h.clients {
		clients = append(clients, struct {
			ID          string    `json:"id"`
			Name        string    `json:"name"`
			LastSeen    time.Time `json:"lastSeen"`
			UnreadCount int       `json:"unreadCount"`
		}{
			ID:          client.id,
			Name:        client.name,
			LastSeen:    client.lastSeen,
			UnreadCount: client.unreadCount,
		})
	}
	h.mutex.RUnlock()

	update := struct {
		Type    string      `json:"type"`
		Clients interface{} `json:"clients"`
	}{
		Type:    "clients_update",
		Clients: clients,
	}

	data, _ := json.Marshal(update)
	select {
	case h.master.send <- data:
	default:
		log.Printf("Master send channel full")
	}
}

func (h *Hub) handleConnection(w http.ResponseWriter, r *http.Request) {
	role := r.URL.Query().Get("role")
	if role != "master" && role != "client" {
		http.Error(w, "Invalid role", http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("Error upgrading connection: %v", err)
		return
	}

	client := &Client{
		id:          fmt.Sprintf("%d", time.Now().UnixNano()),
		conn:        conn,
		role:        role,
		send:        make(chan []byte, 256),
		lastSeen:    time.Now(),
		isTyping:    false,
		unreadCount: 0,
	}

	h.register <- client

	defer func() {
		h.unregister <- client
		conn.Close()
	}()

	go func() {
		for message := range client.send {
			err := conn.WriteMessage(websocket.TextMessage, message)
			if err != nil {
				log.Printf("Error writing message: %v", err)
				return
			}
		}
	}()

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			log.Printf("Error reading message: %v", err)
			break
		}

		var msg Message
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("Error unmarshaling message: %v", err)
			continue
		}

		client.lastSeen = time.Now()
		if msg.Type == "message" {
			msg.Timestamp = time.Now()
			data, _ := json.Marshal(msg)
			h.broadcast <- data
		} else if msg.Type == "typing" {
			client.isTyping = msg.IsTyping
			data, _ := json.Marshal(msg)
			h.broadcast <- data
		}
	}
}

func sendJSONResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Printf("Error encoding JSON response: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func main() {
	config := LoadConfig()

	// Initialize WakaTime handler
	wakaTimeHandler := NewWakaTimeHandler(config.APIKey)

	// Initialize WebSocket hub
	hub := newHub()
	go hub.run()

	// Register handlers
	http.HandleFunc("/api/user", wakaTimeHandler.GetCurrentUserHandler)
	http.HandleFunc("/api/stats", wakaTimeHandler.GetUserStatsHandler)
	http.HandleFunc("/api/summary", wakaTimeHandler.GetUserSummaryHandler)
	http.HandleFunc("/api/durations", wakaTimeHandler.GetUserDurationsHandler)
	http.HandleFunc("/ws", hub.handleConnection)

	// Start server
	serverAddr := fmt.Sprintf(":%s", config.Port)
	fmt.Printf("Starting server on port %s...\n", config.Port)
	log.Fatal(http.ListenAndServe(serverAddr, nil))
}
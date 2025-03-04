package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type Response struct {
	Status  string      `json:"status"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

func main() {
	config := LoadConfig()

	wakaTimeHandler := NewWakaTimeHandler(config.APIKey)
	
	// remember to remove /api before pushing
	http.HandleFunc("/api/user", wakaTimeHandler.GetCurrentUserHandler)
	http.HandleFunc("/api/stats", wakaTimeHandler.GetUserStatsHandler)
	http.HandleFunc("/api/summary", wakaTimeHandler.GetUserSummaryHandler)
	http.HandleFunc("/api/durations", wakaTimeHandler.GetUserDurationsHandler)
	
	serverAddr := fmt.Sprintf(":%s", config.Port)
	fmt.Printf("Starting server on port %s...\n", config.Port)
	log.Fatal(http.ListenAndServe(serverAddr, nil))
}


func sendJSONResponse(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}
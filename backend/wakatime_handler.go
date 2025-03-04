package main

import (
	"net/http"
	"time"
)

type WakaTimeHandler struct {
	Client *WakaTimeClient
}

func NewWakaTimeHandler(apiKey string) *WakaTimeHandler {
	return &WakaTimeHandler{
		Client: NewWakaTimeClient(apiKey),
	}
}

func (h *WakaTimeHandler) GetCurrentUserHandler(w http.ResponseWriter, r *http.Request) {
	userData, err := h.Client.GetCurrentUser()
	if err != nil {
		response := Response{
			Status:  "error",
			Message: "Failed to fetch WakaTime user data: " + err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		sendJSONResponse(w, response)
		return
	}
	
	response := Response{
		Status:  "success",
		Message: "WakaTime user data retrieved successfully",
		Data:    userData,
	}
	
	sendJSONResponse(w, response)
}

func (h *WakaTimeHandler) GetUserStatsHandler(w http.ResponseWriter, r *http.Request) {
	// Get range from query params, default to "last_7_days"
	timeRange := r.URL.Query().Get("range")
	if timeRange == "" {
		timeRange = "last_7_days"
	}
	
	// Valid ranges: "last_7_days", "last_30_days", "last_6_months", "last_year"
	validRanges := map[string]bool{
		"last_7_days":   true,
		"last_30_days":  true,
		"last_6_months": true,
		"last_year":     true,
	}
	
	if !validRanges[timeRange] {
		response := Response{
			Status:  "error",
			Message: "Invalid range parameter. Valid values: last_7_days, last_30_days, last_6_months, last_year",
		}
		w.WriteHeader(http.StatusBadRequest)
		sendJSONResponse(w, response)
		return
	}
	
	stats, err := h.Client.GetUserStats(timeRange)
	if err != nil {
		response := Response{
			Status:  "error",
			Message: "Failed to fetch WakaTime stats: " + err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		sendJSONResponse(w, response)
		return
	}
	
	response := Response{
		Status:  "success",
		Message: "WakaTime stats retrieved successfully",
		Data:    stats,
	}
	
	sendJSONResponse(w, response)
}

func (h *WakaTimeHandler) GetUserSummaryHandler(w http.ResponseWriter, r *http.Request) {

	start := r.URL.Query().Get("start")
	end := r.URL.Query().Get("end")

	if start == "" || end == "" {
		now := time.Now()
		end = now.Format("2006-01-02")
		start = now.AddDate(0, 0, -7).Format("2006-01-02")
	}
	
	summary, err := h.Client.GetUserSummary(start, end)
	if err != nil {
		response := Response{
			Status:  "error",
			Message: "Failed to fetch summary: " + err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		sendJSONResponse(w, response)
		return
	}
	
	response := Response{
		Status:  "success",
		Message: "WakaTime summary retrieved successfully",
		Data:    summary,
	}
	
	sendJSONResponse(w, response)
}

func (h *WakaTimeHandler) GetUserDurationsHandler(w http.ResponseWriter, r *http.Request) {

	date := r.URL.Query().Get("date")
	
	durations, err := h.Client.GetUserDurations(date)
	if err != nil {
		response := Response{
			Status:  "error",
			Message: "Failed to fetch durations: " + err.Error(),
		}
		w.WriteHeader(http.StatusInternalServerError)
		sendJSONResponse(w, response)
		return
	}
	
	response := Response{
		Status:  "success",
		Message: "WakaTime durations retrieved successfully",
		Data:    durations,
	}
	
	sendJSONResponse(w, response)
}
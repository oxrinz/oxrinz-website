package main

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"
)

type WakaTimeClient struct {
	APIKey     string
	BaseURL    string
	HTTPClient *http.Client
}

func NewWakaTimeClient(apiKey string) *WakaTimeClient {
	return &WakaTimeClient{
		APIKey:  apiKey,
		BaseURL: "https://wakatime.com/api/v1",
		HTTPClient: &http.Client{
			Timeout: time.Second * 10,
		},
	}
}

func (c *WakaTimeClient) GetCurrentUser() (map[string]interface{}, error) {
	endpoint := "/users/current"
	return c.makeRequest(endpoint)
}

func (c *WakaTimeClient) GetUserStats(timeRange string) (map[string]interface{}, error) {
	endpoint := "/users/current/stats/" + timeRange
	return c.makeRequest(endpoint)
}

func (c *WakaTimeClient) GetUserSummary(start, end string) (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("/users/current/summaries?start=%s&end=%s", start, end)
	return c.makeRequest(endpoint)
}

func (c *WakaTimeClient) GetUserDurations(date string) (map[string]interface{}, error) {
	endpoint := fmt.Sprintf("/users/current/durations?date%s", date)
	return c.makeRequest(endpoint)
}


func (c *WakaTimeClient) makeRequest(endpoint string) (map[string]interface{}, error) {
	url := c.BaseURL + endpoint
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("error creating request: %w", err)
	}
	
	auth := base64.StdEncoding.EncodeToString([]byte(c.APIKey + ":"))
	req.Header.Add("Authorization", "Basic "+auth)
	
	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("error making request: %w", err)
	}
	defer resp.Body.Close()
	
	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("error reading response body: %w", err)
	}
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error: %s (status code %d)", string(body), resp.StatusCode)
	}
	
	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("error parsing JSON response: %w", err)
	}
	
	return result, nil
}
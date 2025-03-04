package main

import (
	"bufio"
	"log"
	"os"
	"path/filepath"
	"strings"
)

type Config struct {
	Port   string
	APIKey string
}

func LoadConfig() Config {
	loadEnvFile(".")
	loadEnvFile("backend")
	loadEnvFile("..")

	config := Config{
		Port: "8080",
	}

	config.APIKey = os.Getenv("WAKATIME_KEY")
	if config.APIKey == "" {
		log.Println("Warning: API_KEY environment variable not set")
	}

	return config
}

// simple env file parser
func loadEnvFile(dir string) {
	envPath := filepath.Join(dir, ".env")
	
	file, err := os.Open(envPath)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		
		if len(line) == 0 || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) != 2 {
			continue
		}

		key := strings.TrimSpace(parts[0])
		value := strings.TrimSpace(parts[1])

		if len(value) > 1 && (strings.HasPrefix(value, "\"") && strings.HasSuffix(value, "\"")) ||
			(strings.HasPrefix(value, "'") && strings.HasSuffix(value, "'")) {
			value = value[1 : len(value)-1]
		}

		if os.Getenv(key) == "" {
			os.Setenv(key, value)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Printf("Error reading .env file: %v", err)
	}
}
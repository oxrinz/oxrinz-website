const apiBasePath = '/api';

export async function fetchStatsData(range = 'last_7_days') {
  const response = await fetch(`${apiBasePath}/wakatime/stats?range=${range}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
}
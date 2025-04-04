export async function getCurrentWeather() {
  const weather = {
      temperature: "72",
      unit: "F",
      forecast: "sunny"
  }
  return JSON.stringify(weather)
}

export async function getLocation() {
  return "Salt Lake City, UT"
}

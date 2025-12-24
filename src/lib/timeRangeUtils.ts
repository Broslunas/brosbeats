export type TimeRange = "24h" | "7d" | "30d" | "90d" | "all" | "custom";

export function mapTimeRangeToSpotify(range: TimeRange): "short_term" | "medium_term" | "long_term" {
  switch (range) {
    case "24h":
    case "7d":
    case "30d":
      return "short_term"; // Approx 4 weeks
    case "90d":
      return "medium_term"; // Approx 6 months
    case "all":
      return "long_term"; // All time
    default:
      return "medium_term";
  }
}

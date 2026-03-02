import { create } from "xmlbuilder2";

export const handler = async () => {
  try {
    const url = "https://api.twitch.tv/helix/drops/campaigns";

    const response = await fetch(url, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${process.env.TWITCH_OAUTH_TOKEN}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitch API error:", errorText);
      return {
        statusCode: response.status,
        body: `Twitch API error: ${errorText}`
      };
    }

    const data = await response.json();
    let campaigns = data.data || [];

    // Alphabetical sort by game name
    campaigns.sort((a, b) => {
      const nameA = (a.game?.display_name || "").toLowerCase();
      const nameB = (b.game?.display_name || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const feed = {
      rss: {
        "@version": "2.0",
        channel: {
          title: "Active Twitch Drops (All Games, Alphabetical)",
          link: "https://www.twitch.tv/drops",
          description: "Live Twitch Drops campaigns across all games, sorted alphabetically.",
          item: campaigns.map((campaign) => ({
            title: `${campaign.game?.display_name || "Unknown Game"} — ${campaign.name || "Unnamed Campaign"}`,
            description: campaign.description || "No description available.",
            link: campaign.details_url || "https://www.twitch.tv/drops",
            pubDate: campaign.start_at || new Date().toUTCString()
          }))
        }
      }
    };

    const xml = create(feed).end({ prettyPrint: true });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml" },
      body: xml
    };

  } catch (error) {
    console.error("Feed generation error:", error);
    return {
      statusCode: 500,
      body: `Error generating feed: ${error.message}`
    };
  }
};

import { create } from "xmlbuilder2";

export const handler = async () => {
  try {
    // Specific games you want to track
    const gameIds = [
      "497057",      // Destiny 2
      "515025",      // Overwatch 2
      "2125397111",  // Marvel Rivals
      "32399",       // Counter-Strike 2
      "323583"       // Marathon
    ];

    let allCampaigns = [];

    // Fetch campaigns for each game
    for (const gameId of gameIds) {
      const url = `https://api.twitch.tv/helix/drops/campaigns?game_id=${gameId}`;

      const response = await fetch(url, {
        headers: {
          "Client-ID": process.env.TWITCH_CLIENT_ID,
          "Authorization": `Bearer ${process.env.TWITCH_OAUTH_TOKEN}`
        }
      });

      if (!response.ok) {
        console.error(`Twitch API error for game ${gameId}:`, await response.text());
        continue;
      }

      const data = await response.json();

      if (data.data && Array.isArray(data.data)) {
        allCampaigns = allCampaigns.concat(data.data);
      }
    }

    // Build RSS XML
    const feed = {
      rss: {
        "@version": "2.0",
        channel: {
          title: "Active Twitch Drops (Specific Games)",
          link: "https://www.twitch.tv/drops",
          description: "Live Twitch Drops campaigns for selected games.",
          item: allCampaigns.map((campaign) => ({
            title: campaign.name || "Unnamed Campaign",
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

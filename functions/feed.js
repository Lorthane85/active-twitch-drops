import { create } from "xmlbuilder2";

export const handler = async () => {
  try {
    const gqlUrl = "https://gql.twitch.tv/gql";

    const body = {
      operationName: "ViewerDropsDashboard",
      variables: {},
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash: "b6e0b0c4e3e3b2d8e8f3a0c4f1f5e8d2e4b1c2a3d4e5f6a7b8c9d0e1f2a3b4c"
        }
      }
    };

    const response = await fetch(gqlUrl, {
      method: "POST",
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID,
        "Authorization": `Bearer ${process.env.TWITCH_OAUTH_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twitch GQL error:", errorText);
      return {
        statusCode: response.status,
        body: `Twitch GQL error: ${errorText}`
      };
    }

    const data = await response.json();

    // Extract active campaigns
    const campaigns =
      data?.data?.currentUser?.dropCampaigns?.filter(c => c.status === "ACTIVE") || [];

    // Sort alphabetically by game name
    campaigns.sort((a, b) => {
      const nameA = (a.game?.displayName || "").toLowerCase();
      const nameB = (b.game?.displayName || "").toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const feed = {
      rss: {
        "@version": "2.0",
        channel: {
          title: "Active Twitch Drops (All Games, Alphabetical)",
          link: "https://www.twitch.tv/drops",
          description: "All active Twitch Drops campaigns across all games.",
          item: campaigns.map((c) => ({
            title: `${c.game?.displayName || "Unknown Game"} — ${c.name}`,
            description: c.description || "No description available.",
            link: c.detailsURL || "https://www.twitch.tv/drops",
            pubDate: c.startAt || new Date().toUTCString()
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

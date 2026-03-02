import { create } from "xmlbuilder2";

export const handler = async () => {
  try {
    const apiUrl = "https://api.twitch.tv/helix/drops/campaigns?status=active";

    const response = await fetch(apiUrl, {
      headers: {
        "Client-ID": process.env.TWITCH_CLIENT_ID || "",
        "Authorization": `Bearer ${process.env.TWITCH_OAUTH_TOKEN || ""}`
      }
    });

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status}`);
    }

    const data = await response.json();

    const items = (data.data || []).map(campaign => {
      const title = campaign.name || "Twitch Drop";
      const description = campaign.description || "Active Twitch Drop Campaign";
      const link = campaign.details_url || "https://www.twitch.tv/drops";
      const pubDate = new Date(campaign.start_at).toUTCString();

      return { title, description, link, pubDate };
    });

    const rss = create({ version: "1.0", encoding: "UTF-8" })
      .ele("rss", { version: "2.0" })
      .ele("channel")
      .ele("title").txt("Active Twitch Drops Feed").up()
      .ele("link").txt("https://www.twitch.tv/drops").up()
      .ele("description").txt("Auto-updating feed of active Twitch Drops").up()
      .ele("language").txt("en-us").up();

    items.forEach(item => {
      rss.ele("item")
        .ele("title").txt(item.title).up()
        .ele("description").txt(item.description).up()
        .ele("link").txt(item.link).up()
        .ele("pubDate").txt(item.pubDate).up()
        .up();
    });

    const xml = rss.end({ prettyPrint: true });

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/xml" },
      body: xml
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: `Error generating feed: ${error.message}`
    };
  }
};

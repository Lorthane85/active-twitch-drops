import fetch from "node-fetch";
import { create } from "xmlbuilder2";

export const handler = async () => {
  const games = [
    "Marvel Rivals",
    "Counter-Strike 2",
    "Overwatch 2",
    "Marathon",
    "Destiny 2"
  ];

  const api = "https://api.twitch.tv/helix/drops/campaigns"; // public endpoint

  const responses = await Promise.all(
    games.map(async (game) => {
      const res = await fetch(`${api}?game=${encodeURIComponent(game)}`);
      const data = await res.json();
      return { game, campaigns: data.data || [] };
    })
  );

  const active = responses.map(({ game, campaigns }) => ({
    game,
    campaigns: campaigns.filter((c) => new Date(c.end_at) > new Date())
  }));

  const root = create({ version: "1.0" })
    .ele("rss", { version: "2.0" })
    .ele("channel")
    .ele("title").txt("Active Twitch Drops").up()
    .ele("link").txt("https://active-twitch-drops.netlify.app/feed.xml").up()
    .ele("description").txt("Combined active Twitch Drops feed").up();

  active.forEach(({ game, campaigns }) => {
    campaigns.forEach((c) => {
      root
        .ele("item")
        .ele("title").txt(`${game}: ${c.name}`).up()
        .ele("link").txt(c.campaign_url).up()
        .ele("guid").txt(c.id).up()
        .ele("pubDate").txt(new Date(c.start_at).toUTCString()).up()
        .ele("description").txt(`${game} – ${c.name}`).up()
        .up();
    });
  });

  const xml = root.end({ prettyPrint: true });

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/xml" },
    body: xml
  };
};

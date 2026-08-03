export interface KnownConnectorApp {
  id: string;
  name: string;
  iconName: string;
  domainRegex: RegExp;
  description: string;
}

export const KNOWN_CONNECTOR_APPS: KnownConnectorApp[] = [
  {
    id: "GITHUB",
    name: "GitHub",
    iconName: "github",
    domainRegex: /^(https?:\/\/)?(www\.)?github\.com\/.+/i,
    description: "Sync repositories, code snippets, issues, and gists automatically into your vault.",
  },
  {
    id: "GOOGLE_DRIVE",
    name: "Google Drive",
    iconName: "google-drive",
    domainRegex: /^(https?:\/\/)?(www\.)?(drive|docs)\.google\.com\/.+/i,
    description: "Sync cloud documents, PDFs, and spreadsheets from Google Drive.",
  },
  {
    id: "NOTION",
    name: "Notion",
    iconName: "notion",
    domainRegex: /^(https?:\/\/)?(www\.)?notion\.(so|site)\/.+/i,
    description: "Mount Notion workspace pages and databases into Linkaroo.",
  },
  {
    id: "SLACK",
    name: "Slack",
    iconName: "slack",
    domainRegex: /^(https?:\/\/)?(www\.)?slack\.com\/.+/i,
    description: "Save messages and canvas documents from Slack workspace channels.",
  },
  {
    id: "SPOTIFY",
    name: "Spotify",
    iconName: "spotify",
    domainRegex: /^(https?:\/\/)?(open\.)?spotify\.com\/.+/i,
    description: "Import saved albums, playlists, and podcast episodes.",
  },
  {
    id: "DROPBOX",
    name: "Dropbox",
    iconName: "dropbox",
    domainRegex: /^(https?:\/\/)?(www\.)?dropbox\.com\/.+/i,
    description: "Sync shared cloud files and documents from Dropbox.",
  },
];

export function detectConnectorApp(url: string): KnownConnectorApp | null {
  if (!url) return null;
  for (const app of KNOWN_CONNECTOR_APPS) {
    if (app.domainRegex.test(url.trim())) {
      return app;
    }
  }
  return null;
}

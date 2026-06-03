export interface WebsiteFile {
  name: string;
  isDirectory: boolean;
  size: number;
  ext: string;
  modifiedAt: string;
}

export interface WebsiteDomain {
  domain: string | null;
  subdomain: string | null;
  dnsConfigured: boolean;
}

export interface ChatAction {
  action: "write" | "reply";
  file?: string;
  text: string;
  content?: string;
}

export type ReleaseAsset = { name: string; browser_download_url: string };

export type GithubRelease = {
  tag_name: string;
  target_commitish: string;
  assets: ReleaseAsset[];
};

export type ReleaseIdentity = {
  version: string;
  commit: string;
};

export type PublishedDesktopRelease = GithubRelease & {
  macArm: ReleaseAsset;
  macIntel: ReleaseAsset;
  windows: ReleaseAsset;
  linux: ReleaseAsset;
};

/**
 * A release must describe the exact source embedded in the running site.
 * Asset completeness alone is not enough: an older desktop package can have
 * every platform artifact while still containing different application code.
 */
export function resolvePublishedDesktopRelease(value: unknown, identity: ReleaseIdentity): PublishedDesktopRelease | null {
  if (!value || typeof value !== "object") return null;
  const release = value as Partial<GithubRelease>;
  if (release.tag_name !== `v${identity.version}` || release.target_commitish !== identity.commit || !Array.isArray(release.assets)) return null;
  const assets = release.assets.filter((asset): asset is ReleaseAsset => Boolean(asset && typeof asset.name === "string" && typeof asset.browser_download_url === "string"));
  const macArm = assets.find(item => /\.dmg$/i.test(item.name) && /(aarch64|arm64)/i.test(item.name));
  const macIntel = assets.find(item => /\.dmg$/i.test(item.name) && /(x86_64|x64|intel)/i.test(item.name));
  const windows = assets.find(item => /\.(msi|exe)$/i.test(item.name));
  const linux = assets.find(item => /\.(AppImage|deb)$/i.test(item.name));
  const checksums = assets.some(item => item.name === "SHA256SUMS");
  const manifest = assets.some(item => item.name === "latest.json");
  if (!checksums || !manifest || !macArm || !macIntel || !windows || !linux) return null;
  return { tag_name: release.tag_name, target_commitish: release.target_commitish, assets, macArm, macIntel, windows, linux };
}

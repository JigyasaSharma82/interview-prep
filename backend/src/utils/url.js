import dns from "node:dns/promises";
import net from "node:net";

const isPrivateIp = (ip) => {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);

    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    );
  }

  if (net.isIPv6(ip)) {
    const normalized = ip.toLowerCase();

    return (
      normalized === "::1" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return false;
};

export const validateExternalUrl = async (url) => {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error("Invalid URL");
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  const hostname = parsedUrl.hostname;

  // Direct IP address
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      throw new Error("Private or loopback URLs are not allowed");
    }

    return true;
  }

  // Resolve hostname to IP addresses
  const addresses = await dns.lookup(hostname, {
    all: true,
  });

  for (const address of addresses) {
    if (isPrivateIp(address.address)) {
      throw new Error("URL resolves to a private or loopback address");
    }
  }

  return true;
};
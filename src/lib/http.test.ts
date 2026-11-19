import { describe, expect, it } from "vitest";
import { clientIp, sameOrigin } from "./http";

describe("sameOrigin", () => {
  it("accepts a matching browser origin and rejects a missing or foreign one", () => {
    const ok = new Request("https://kindle.local/api/session", {
      headers: { origin: "https://kindle.local", host: "kindle.local" },
    });
    const missing = new Request("https://kindle.local/api/session", {
      headers: { host: "kindle.local" },
    });
    const foreign = new Request("https://kindle.local/api/session", {
      headers: { origin: "https://evil.example", host: "kindle.local" },
    });
    expect(sameOrigin(ok)).toBe(true);
    expect(sameOrigin(missing)).toBe(false);
    expect(sameOrigin(foreign)).toBe(false);
  });
});

describe("clientIp", () => {
  it("uses the first forwarded address and ignores the rest", () => {
    const request = new Request("http://localhost/api/session", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(clientIp(request)).toBe("203.0.113.5");
  });
});

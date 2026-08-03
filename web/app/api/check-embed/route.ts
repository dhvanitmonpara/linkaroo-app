import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get("url");

  if (!targetUrl) {
    return NextResponse.json({ embeddable: false });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    let res = await fetch(targetUrl, {
      method: "HEAD",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: controller.signal,
      redirect: "follow",
    }).catch(() => null);

    if (!res || res.status === 405) {
      res = await fetch(targetUrl, {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: controller.signal,
        redirect: "follow",
      }).catch(() => null);
    }

    clearTimeout(timeoutId);

    if (!res || !res.ok) {
      return NextResponse.json({ embeddable: false });
    }

    const xfo = res.headers.get("x-frame-options")?.toLowerCase();
    const csp = res.headers.get("content-security-policy")?.toLowerCase();

    if (xfo && (xfo.includes("deny") || xfo.includes("sameorigin"))) {
      return NextResponse.json({ embeddable: false });
    }

    if (
      csp &&
      (csp.includes("frame-ancestors 'none'") ||
        csp.includes("frame-ancestors 'self'") ||
        (csp.includes("frame-ancestors") && !csp.includes("frame-ancestors *")))
    ) {
      return NextResponse.json({ embeddable: false });
    }

    return NextResponse.json({ embeddable: true });
  } catch {
    return NextResponse.json({ embeddable: false });
  }
}

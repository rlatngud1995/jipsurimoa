
/* =====================================
   집수리모아 시공 카테고리 사이트맵

   주소:
   https://www.jipsurimoa.com/services-sitemap.xml

   기존 sitemap.xml은 건드리지 않습니다.
===================================== */

const SITE_URL = "https://www.jipsurimoa.com";

/* 현재 만든 시공 서브페이지 주소 */
const SERVICES = [
  "cooktop",
  "sink",
  "tree",
  "petdoor",
  "faucet",
  "aircon",
  "refrigerator",
  "repair",
];

/* 현재 만든 지역별 페이지의 시·도 주소 */
const PROVINCES = [
  "seoul",
  "busan",
  "daegu",
  "incheon",
  "gwangju",
  "daejeon",
  "ulsan",
  "sejong",
  "gyeonggi",
  "gangwon",
  "chungbuk",
  "chungnam",
  "jeonbuk",
  "jeonnam",
  "gyeongbuk",
  "gyeongnam",
  "jeju",
];

/*
  서울 시·군·구 페이지는 기존 쿡탑 페이지와
  검색 주소가 중복될 수 있으므로
  이번 사이트맵에는 넣지 않습니다.

  시·군·구 / 읍·면·동 주소는
  실제 등록 업체와 페이지 내용을 확인한 뒤
  추가하는 방식으로 진행합니다.
*/

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const paths = new Set<string>();

  for (const service of SERVICES) {
    paths.add(`/services/${service}`);

    for (const province of PROVINCES) {
      paths.add(`/services/${service}/${province}`);
    }
  }

  const urls = Array.from(paths).map((path) => {
    const url = escapeXml(`${SITE_URL}${path}`);

    return `  <url>
    <loc>${url}</loc>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}

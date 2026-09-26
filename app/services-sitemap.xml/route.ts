import { NextResponse } from "next/server";
import {
  loadLegalDongs,
} from "../data/legal-dongs";

/* =========================================
   집수리모아 서비스 사이트맵 INDEX

   파일:
   app/services-sitemap.xml/route.ts

   역할:
   전국 서비스 지역 URL이 많기 때문에
   한 개 사이트맵에 모두 넣지 않고
   여러 사이트맵으로 자동 분할

   생성 예:

   /services-sitemap/1
   /services-sitemap/2
   /services-sitemap/3
   ...
========================================= */

const SITE_URL =
  "https://www.jipsurimoa.com";

/* =========================================
   서비스 13개
========================================= */

const SERVICES = [
  "repair",
  "sink",
  "cooktop",
  "demolition",
  "tree",
  "bathroom",
  "electrical",
  "aircon",
  "faucet",
  "plumbing",
  "petdoor",
  "refrigerator",
  "other",
];

/* =========================================
   사이트맵 한 파일당 URL 수

   검색엔진 제한은 50,000개지만
   여유 있게 40,000개로 설정
========================================= */

const URLS_PER_SITEMAP =
  40000;

/* =========================================
   XML 특수문자 처리
========================================= */

function escapeXml(
  value: string
): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/* =========================================
   사이트맵 INDEX 생성
========================================= */

export async function GET() {
  try {
    /* =====================================
       공식 법정동 데이터 불러오기
    ===================================== */

    const legalDongs =
      await loadLegalDongs();

    /* =====================================
       동 중복 제거

       예:
       충청남도|천안시|불당동

       같은 주소가 중복으로 들어오는 경우 제거
    ===================================== */

    const neighborhoodKeys =
      new Set<string>();

    for (
      const dong of
      legalDongs
    ) {
      neighborhoodKeys.add(
        [
          dong.region,
          dong.district,
          dong.neighborhood,
        ].join("|")
      );
    }

    /* =====================================
       예상 URL 개수

       동 URL
       =
       전체 읍면동 × 13개 서비스

       여기에 서비스 기본,
       시도,
       시군구 페이지가 추가되므로
       약간의 여유분 추가
    ===================================== */

    const neighborhoodUrlCount =
      neighborhoodKeys.size *
      SERVICES.length;

    /*
      서비스 기본 + 시도 + 시군구용
      충분한 여유값
    */

    const additionalUrlCount =
      10000;

    const totalUrlCount =
      neighborhoodUrlCount +
      additionalUrlCount;

    /* =====================================
       필요한 사이트맵 개수
    ===================================== */

    const sitemapCount =
      Math.max(
        1,
        Math.ceil(
          totalUrlCount /
            URLS_PER_SITEMAP
        )
      );

    /* =====================================
       Sitemap Index XML
    ===================================== */

    const sitemapUrls:
      string[] = [];

    for (
      let page = 1;
      page <= sitemapCount;
      page++
    ) {
      sitemapUrls.push(
        `${SITE_URL}/services-sitemap/${page}`
      );
    }

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',

      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',

      ...sitemapUrls.map(
        (url) =>
          [
            "  <sitemap>",
            `    <loc>${escapeXml(
              url
            )}</loc>`,
            "  </sitemap>",
          ].join("\n")
      ),

      "</sitemapindex>",
    ].join("\n");

    return new NextResponse(
      xml,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/xml; charset=utf-8",

          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=86400",
        },
      }
    );
  } catch (error) {
    console.error(
      "서비스 사이트맵 INDEX 생성 실패:",
      error
    );

    /*
      공식 데이터 서버가 일시적으로
      응답하지 않아도 XML 자체는 깨지지 않게 처리
    */

    const fallbackXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',

      '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',

      `  <sitemap><loc>${SITE_URL}/services-sitemap/1</loc></sitemap>`,

      "</sitemapindex>",
    ].join("\n");

    return new NextResponse(
      fallbackXml,
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/xml; charset=utf-8",

          "Cache-Control":
            "public, s-maxage=3600",
        },
      }
    );
  }
}

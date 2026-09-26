import { NextResponse } from "next/server";
import {
  loadLegalDongs,
  type LegalDong,
} from "../../data/legal-dongs";

/* =========================================
   집수리모아 분할 서비스 사이트맵

   파일:
   app/services-sitemap/[page]/route.ts

   예:
   /services-sitemap/1
   /services-sitemap/2
   /services-sitemap/3

   13개 카테고리
   × 전국 시도
   × 전국 시군구
   × 전국 읍면동
========================================= */

const SITE_URL =
  "https://www.jipsurimoa.com";

const URLS_PER_SITEMAP =
  40000;

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
] as const;

/* =========================================
   시도 slug
========================================= */

const REGION_SLUGS: Record<
  string,
  string
> = {
  서울특별시: "seoul",

  경기도: "gyeonggi",

  인천광역시: "incheon",

  부산광역시: "busan",

  대구광역시: "daegu",

  대전광역시: "daejeon",

  울산광역시: "ulsan",

  세종특별자치시: "sejong",

  강원특별자치도: "gangwon",
  강원도: "gangwon",

  충청북도: "chungbuk",

  충청남도: "chungnam",

  전북특별자치도: "jeonbuk",
  전라북도: "jeonbuk",

  전라남도: "jeonnam",

  경상북도: "gyeongbuk",

  경상남도: "gyeongnam",

  제주특별자치도: "jeju",

  /*
    2026년 7월 변경자료에
    나타나는 명칭도 대응
  */

  전남광주통합특별시:
    "gwangju",
};

/* =========================================
   광주 호환

   기존 집수리모아 주소 구조 유지
========================================= */

function getRegionSlug(
  region: string
): string | null {
  if (
    region ===
    "광주광역시"
  ) {
    return "gwangju";
  }

  return (
    REGION_SLUGS[
      region
    ] ?? null
  );
}

/* =========================================
   시군구 slug

   기존 사이트에서 쓰던 영문 주소와
   동일하게 유지
========================================= */

const DISTRICT_SLUGS: Record<
  string,
  string
> = {
  /* 서울 */

  강남구: "gangnam",
  강동구: "gangdong",
  강북구: "gangbuk",
  강서구: "gangseo",
  관악구: "gwanak",
  광진구: "gwangjin",
  구로구: "guro",
  금천구: "geumcheon",
  노원구: "nowon",
  도봉구: "dobong",
  동대문구: "dongdaemun",
  동작구: "dongjak",
  마포구: "mapo",
  서대문구: "seodaemun",
  서초구: "seocho",
  성동구: "seongdong",
  성북구: "seongbuk",
  송파구: "songpa",
  양천구: "yangcheon",
  영등포구: "yeongdeungpo",
  용산구: "yongsan",
  은평구: "eunpyeong",
  종로구: "jongno",
  중랑구: "jungnang",

  /* 경기 */

  가평군: "gapyeong",
  고양시: "goyang",
  과천시: "gwacheon",
  광명시: "gwangmyeong",
  광주시: "gwangju",
  구리시: "guri",
  군포시: "gunpo",
  김포시: "gimpo",
  남양주시: "namyangju",
  동두천시: "dongducheon",
  부천시: "bucheon",
  성남시: "seongnam",
  수원시: "suwon",
  시흥시: "siheung",
  안산시: "ansan",
  안성시: "anseong",
  안양시: "anyang",
  양주시: "yangju",
  양평군: "yangpyeong",
  여주시: "yeoju",
  연천군: "yeoncheon",
  오산시: "osan",
  용인시: "yongin",
  의왕시: "uiwang",
  의정부시: "uijeongbu",
  이천시: "icheon",
  파주시: "paju",
  평택시: "pyeongtaek",
  포천시: "pocheon",
  하남시: "hanam",
  화성시: "hwaseong",

  /* 인천 2026 */

  강화군: "ganghwa",
  계양구: "gyeyang",
  남동구: "namdong",
  미추홀구: "michuhol",
  부평구: "bupyeong",
  연수구: "yeonsu",
  옹진군: "ongjin",
  제물포구: "jemulpo",
  영종구: "yeongjong",
  서해구: "seohae",
  검단구: "geomdan",

  /* 부산 */

  금정구: "geumjeong",
  기장군: "gijang",
  동래구: "dongnae",
  부산진구: "busanjin",
  사상구: "sasang",
  사하구: "saha",
  수영구: "suyeong",
  연제구: "yeonje",
  영도구: "yeongdo",
  해운대구: "haeundae",

  /* 대구 */

  군위군: "gunwi",
  달서구: "dalseo",
  달성군: "dalseong",
  수성구: "suseong",

  /* 광주 */

  광산구: "gwangsan",

  /* 대전 */

  대덕구: "daedeok",
  유성구: "yuseong",

  /* 울산 */

  울주군: "ulju",

  /* 강원 */

  강릉시: "gangneung",
  고성군: "goseong",
  동해시: "donghae",
  삼척시: "samcheok",
  속초시: "sokcho",
  양구군: "yanggu",
  양양군: "yangyang",
  영월군: "yeongwol",
  원주시: "wonju",
  인제군: "inje",
  정선군: "jeongseon",
  철원군: "cheorwon",
  춘천시: "chuncheon",
  태백시: "taebaek",
  평창군: "pyeongchang",
  홍천군: "hongcheon",
  화천군: "hwacheon",
  횡성군: "hoengseong",

  /* 충북 */

  괴산군: "goesan",
  단양군: "danyang",
  보은군: "boeun",
  영동군: "yeongdong",
  옥천군: "okcheon",
  음성군: "eumseong",
  제천시: "jecheon",
  증평군: "jeungpyeong",
  진천군: "jincheon",
  청주시: "cheongju",
  충주시: "chungju",

  /* 충남 */

  계룡시: "gyeryong",
  공주시: "gongju",
  금산군: "geumsan",
  논산시: "nonsan",
  당진시: "dangjin",
  보령시: "boryeong",
  부여군: "buyeo",
  서산시: "seosan",
  서천군: "seocheon",
  아산시: "asan",
  예산군: "yesan",
  천안시: "cheonan",
  청양군: "cheongyang",
  태안군: "taean",
  홍성군: "hongseong",

  /* 전북 */

  고창군: "gochang",
  군산시: "gunsan",
  김제시: "gimje",
  남원시: "namwon",
  무주군: "muju",
  부안군: "buan",
  순창군: "sunchang",
  완주군: "wanju",
  익산시: "iksan",
  임실군: "imsil",
  장수군: "jangsu",
  전주시: "jeonju",
  정읍시: "jeongeup",
  진안군: "jinan",

  /* 전남 */

  강진군: "gangjin",
  고흥군: "goheung",
  곡성군: "gokseong",
  광양시: "gwangyang",
  구례군: "gurye",
  나주시: "naju",
  담양군: "damyang",
  목포시: "mokpo",
  무안군: "muan",
  보성군: "boseong",
  순천시: "suncheon",
  신안군: "sinan",
  여수시: "yeosu",
  영광군: "yeonggwang",
  영암군: "yeongam",
  완도군: "wando",
  장성군: "jangseong",
  장흥군: "jangheung",
  진도군: "jindo",
  함평군: "hampyeong",
  해남군: "haenam",
  화순군: "hwasun",

  /* 경북 */

  경산시: "gyeongsan",
  경주시: "gyeongju",
  고령군: "goryeong",
  구미시: "gumi",
  김천시: "gimcheon",
  문경시: "mungyeong",
  봉화군: "bonghwa",
  상주시: "sangju",
  성주군: "seongju",
  안동시: "andong",
  영덕군: "yeongdeok",
  영양군: "yeongyang",
  영주시: "yeongju",
  영천시: "yeongcheon",
  예천군: "yecheon",
  울릉군: "ulleung",
  울진군: "uljin",
  의성군: "uiseong",
  청도군: "cheongdo",
  청송군: "cheongsong",
  칠곡군: "chilgok",
  포항시: "pohang",

  /* 경남 */

  거제시: "geoje",
  거창군: "geochang",
  김해시: "gimhae",
  남해군: "namhae",
  밀양시: "miryang",
  사천시: "sacheon",
  산청군: "sancheong",
  양산시: "yangsan",
  의령군: "uiryeong",
  진주시: "jinju",
  창녕군: "changnyeong",
  창원시: "changwon",
  통영시: "tongyeong",
  하동군: "hadong",
  함안군: "haman",
  함양군: "hamyang",
  합천군: "hapcheon",

  /* 제주 */

  서귀포시: "seogwipo",
  제주시: "jeju",
};

/* =========================================
   같은 이름 구 처리

   중구 / 동구 / 남구 / 북구 / 서구 등은
   여러 시도에서 중복되므로
   별도 변환
========================================= */

function getDistrictSlug(
  regionSlug: string,
  district: string
): string | null {
  const common:
    Record<
      string,
      string
    > = {
    중구: "jung",
    동구: "dong",
    서구: "seo",
    남구: "nam",
    북구: "buk",
  };

  if (
    common[district]
  ) {
    return common[
      district
    ];
  }

  /*
    서울 강서구처럼
    REGION과 관계없이
    고유 이름이면 위 테이블 사용
  */

  const slug =
    DISTRICT_SLUGS[
      district
    ];

  if (slug) {
    return slug;
  }

  /*
    사용하지 않는 변수 경고 방지
  */

  void regionSlug;

  return null;
}

/* =========================================
   URL
========================================= */

function createUrl(
  service: string,
  parts: string[] = []
): string {
  const encodedParts =
    parts.map(
      (part) =>
        encodeURIComponent(
          part
        )
    );

  return [
    SITE_URL,
    "services",
    service,
    ...encodedParts,
  ].join("/");
}

/* =========================================
   법정동 → URL용 구조
========================================= */

type LocationItem = {
  regionSlug: string;
  districtSlug: string | null;
  neighborhood: string;
};

/* =========================================
   전국 법정동 정리
========================================= */

function makeLocations(
  legalDongs: LegalDong[]
): LocationItem[] {
  const result =
    new Map<
      string,
      LocationItem
    >();

  for (
    const dong of
    legalDongs
  ) {
    const regionSlug =
      getRegionSlug(
        dong.region
      );

    if (
      !regionSlug
    ) {
      continue;
    }

    /*
      세종
    */

    if (
      regionSlug ===
      "sejong"
    ) {
      const key =
        [
          regionSlug,
          dong.neighborhood,
        ].join("|");

      result.set(
        key,
        {
          regionSlug,
          districtSlug:
            null,
          neighborhood:
            dong.neighborhood,
        }
      );

      continue;
    }

    if (
      !dong.district
    ) {
      continue;
    }

    const districtSlug =
      getDistrictSlug(
        regionSlug,
        dong.district
      );

    if (
      !districtSlug
    ) {
      /*
        기존 집수리모아에 없는
        시군구는 잘못된 주소 생성을
        막기 위해 제외
      */

      continue;
    }

    const key =
      [
        regionSlug,
        districtSlug,
        dong.neighborhood,
      ].join("|");

    result.set(
      key,
      {
        regionSlug,
        districtSlug,
        neighborhood:
          dong.neighborhood,
      }
    );
  }

  return [
    ...result.values(),
  ];
}

/* =========================================
   XML
========================================= */

function escapeXml(
  value: string
): string {
  return value
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&apos;"
    );
}

/* =========================================
   GET
========================================= */

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      page: string;
    }>;
  }
) {
  try {
    const {
      page,
    } =
      await context.params;

    const pageNumber =
      Number(page);

    if (
      !Number.isInteger(
        pageNumber
      ) ||
      pageNumber < 1
    ) {
      return new NextResponse(
        "Invalid sitemap page",
        {
          status: 404,
        }
      );
    }

    /* =====================================
       공식 법정동
    ===================================== */

    const legalDongs =
      await loadLegalDongs();

    const locations =
      makeLocations(
        legalDongs
      );

    /*
      URL 중복 방지
    */

    const urls =
      new Set<string>();

    /* =====================================
       서비스별 URL 생성
    ===================================== */

    for (
      const service of
      SERVICES
    ) {
      /*
        서비스 기본

        /services/sink
      */

      urls.add(
        createUrl(
          service
        )
      );

      /*
        시도 목록
      */

      const regions =
        new Set<string>();

      /*
        시군구 목록
      */

      const districts =
        new Set<string>();

      for (
        const location of
        locations
      ) {
        regions.add(
          location.regionSlug
        );

        /*
          세종
        */

        if (
          !location.districtSlug
        ) {
          urls.add(
            createUrl(
              service,
              [
                location.regionSlug,
                location.neighborhood,
              ]
            )
          );

          continue;
        }

        districts.add(
          [
            location.regionSlug,
            location.districtSlug,
          ].join("|")
        );

        /*
          읍면동
        */

        urls.add(
          createUrl(
            service,
            [
              location.regionSlug,
              location.districtSlug,
              location.neighborhood,
            ]
          )
        );
      }

      /*
        시도 URL
      */

      for (
        const regionSlug of
        regions
      ) {
        urls.add(
          createUrl(
            service,
            [
              regionSlug,
            ]
          )
        );
      }

      /*
        시군구 URL
      */

      for (
        const district of
        districts
      ) {
        const [
          regionSlug,
          districtSlug,
        ] =
          district.split(
            "|"
          );

        urls.add(
          createUrl(
            service,
            [
              regionSlug,
              districtSlug,
            ]
          )
        );
      }
    }

    /* =====================================
       정렬

       호출할 때마다 순서가 바뀌지 않게
    ===================================== */

    const allUrls =
      [...urls].sort();

    /* =====================================
       분할
    ===================================== */

    const totalPages =
      Math.max(
        1,
        Math.ceil(
          allUrls.length /
            URLS_PER_SITEMAP
        )
      );

    if (
      pageNumber >
      totalPages
    ) {
      return new NextResponse(
        "Sitemap page not found",
        {
          status: 404,
        }
      );
    }

    const start =
      (pageNumber - 1) *
      URLS_PER_SITEMAP;

    const end =
      start +
      URLS_PER_SITEMAP;

    const pageUrls =
      allUrls.slice(
        start,
        end
      );

    /* =====================================
       Sitemap XML
    ===================================== */

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',

      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',

      ...pageUrls.map(
        (url) =>
          [
            "  <url>",
            `    <loc>${escapeXml(
              url
            )}</loc>`,
            "  </url>",
          ].join("\n")
      ),

      "</urlset>",
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

          "X-Sitemap-Page":
            String(
              pageNumber
            ),

          "X-Sitemap-Total-Pages":
            String(
              totalPages
            ),

          "X-Sitemap-URLs":
            String(
              pageUrls.length
            ),
        },
      }
    );
  } catch (error) {
    console.error(
      "분할 사이트맵 생성 실패:",
      error
    );

    return new NextResponse(
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      ].join("\n"),
      {
        status: 500,

        headers: {
          "Content-Type":
            "application/xml; charset=utf-8",
        },
      }
    );
  }
}

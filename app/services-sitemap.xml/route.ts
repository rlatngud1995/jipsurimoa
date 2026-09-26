import { NextResponse } from "next/server";

/* =========================================
   집수리모아 서비스별 지역 사이트맵

   파일:
   app/services-sitemap.xml/route.ts

   생성 주소 예시:
   /services/plumbing/seoul
   /services/plumbing/seoul/gangnam
   /services/plumbing/gyeonggi/suwon
   /services/plumbing/chungnam/cheonan

   시·도 및 시·군·구 주소는 영어로 통일
========================================= */

const SITE_URL = "https://www.jipsurimoa.com";

const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
)
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type Service = {
  slug: string;
  matches: string[];
};

type District = {
  slug: string;
  name: string;
};

type Region = {
  slug: string;
  name: string;
  aliases: string[];
  districts: string;
};

type Company = {
  id: string | number;
  regions: string[] | null;
  services: string[] | null;
};

/* =========================================
   서비스 카테고리

   서비스 페이지와 동일한 13개 카테고리
========================================= */

const SERVICES: Service[] = [
  {
    slug: "repair",
    matches: ["집수리", "종합수리"],
  },
  {
    slug: "sink",
    matches: ["싱크볼", "싱크대", "싱크"],
  },
  {
    slug: "cooktop",
    matches: [
      "쿡탑",
      "인덕션",
      "가스레인지",
      "가스렌지",
    ],
  },
  {
    slug: "demolition",
    matches: [
      "철거",
      "원상복구",
      "폐기물",
    ],
  },
  {
    slug: "tree",
    matches: [
      "벌목",
      "조경",
      "나무제거",
      "위험목",
    ],
  },
  {
    slug: "bathroom",
    matches: [
      "욕실",
      "화장실",
      "변기",
      "세면대",
      "샤워부스",
      "욕조",
    ],
  },
  {
    slug: "electrical",
    matches: [
      "전기",
      "조명",
      "콘센트",
      "스위치",
      "차단기",
      "실링팬",
    ],
  },
  {
    slug: "aircon",
    matches: ["에어컨"],
  },
  {
    slug: "faucet",
    matches: ["수전"],
  },

  /* 누수·수도설비 */
  {
    slug: "plumbing",
    matches: [
      "누수",
      "누수탐지",
      "누수공사",
      "수도설비",
      "수도배관",
      "수도수리",
      "수도공사",
      "배관",
      "배관수리",
      "배관누수",
      "수도관",
      "수도관교체",
    ],
  },

  {
    slug: "petdoor",
    matches: ["펫도어"],
  },
  {
    slug: "refrigerator",
    matches: [
      "냉장고철거",
      "냉장고장철거",
    ],
  },
  {
    slug: "other",
    matches: [
      "기타 시공",
      "기타시공",
      "기타 집수리",
      "기타집수리",
    ],
  },
];

/* =========================================
   전국 지역별 영어 주소
========================================= */

const REGIONS: Region[] = [
  {
    slug: "seoul",
    name: "서울",
    aliases: ["서울", "서울시", "서울특별시"],
    districts:
      "gangnam:강남구,gangdong:강동구,gangbuk:강북구,gangseo:강서구,gwanak:관악구,gwangjin:광진구,guro:구로구,geumcheon:금천구,nowon:노원구,dobong:도봉구,dongdaemun:동대문구,dongjak:동작구,mapo:마포구,seodaemun:서대문구,seocho:서초구,seongdong:성동구,seongbuk:성북구,songpa:송파구,yangcheon:양천구,yeongdeungpo:영등포구,yongsan:용산구,eunpyeong:은평구,jongno:종로구,jung:중구,jungnang:중랑구",
  },
  {
    slug: "gyeonggi",
    name: "경기",
    aliases: ["경기", "경기도"],
    districts:
      "gapyeong:가평군,goyang:고양시,gwacheon:과천시,gwangmyeong:광명시,gwangju:광주시,guri:구리시,gunpo:군포시,gimpo:김포시,namyangju:남양주시,dongducheon:동두천시,bucheon:부천시,seongnam:성남시,suwon:수원시,siheung:시흥시,ansan:안산시,anseong:안성시,anyang:안양시,yangju:양주시,yangpyeong:양평군,yeoju:여주시,yeoncheon:연천군,osan:오산시,yongin:용인시,uiwang:의왕시,uijeongbu:의정부시,icheon:이천시,paju:파주시,pyeongtaek:평택시,pocheon:포천시,hanam:하남시,hwaseong:화성시",
  },
  {
    slug: "incheon",
    name: "인천",
    aliases: ["인천", "인천시", "인천광역시"],
    districts:
      "ganghwa:강화군,gyeyang:계양구,namdong:남동구,dong:동구,michuhol:미추홀구,bupyeong:부평구,seo:서구,yeonsu:연수구,ongjin:옹진군,jung:중구",
  },
  {
    slug: "busan",
    name: "부산",
    aliases: ["부산", "부산시", "부산광역시"],
    districts:
      "gangseo:강서구,geumjeong:금정구,gijang:기장군,nam:남구,dong:동구,dongnae:동래구,busanjin:부산진구,buk:북구,sasang:사상구,saha:사하구,seo:서구,suyeong:수영구,yeonje:연제구,yeongdo:영도구,jung:중구,haeundae:해운대구",
  },
  {
    slug: "daegu",
    name: "대구",
    aliases: ["대구", "대구시", "대구광역시"],
    districts:
      "gunwi:군위군,nam:남구,dalseo:달서구,dalseong:달성군,dong:동구,buk:북구,seo:서구,suseong:수성구,jung:중구",
  },
  {
    slug: "gwangju",
    name: "광주",
    aliases: ["광주", "광주광역시"],
    districts:
      "gwangsan:광산구,nam:남구,dong:동구,buk:북구,seo:서구",
  },
  {
    slug: "daejeon",
    name: "대전",
    aliases: ["대전", "대전시", "대전광역시"],
    districts:
      "daedeok:대덕구,dong:동구,seo:서구,yuseong:유성구,jung:중구",
  },
  {
    slug: "ulsan",
    name: "울산",
    aliases: ["울산", "울산시", "울산광역시"],
    districts:
      "nam:남구,dong:동구,buk:북구,ulju:울주군,jung:중구",
  },
  {
    slug: "sejong",
    name: "세종",
    aliases: ["세종", "세종시", "세종특별자치시"],
    districts: "",
  },
  {
    slug: "gangwon",
    name: "강원",
    aliases: [
      "강원",
      "강원도",
      "강원특별자치도",
    ],
    districts:
      "gangneung:강릉시,goseong:고성군,donghae:동해시,samcheok:삼척시,sokcho:속초시,yanggu:양구군,yangyang:양양군,yeongwol:영월군,wonju:원주시,inje:인제군,jeongseon:정선군,cheorwon:철원군,chuncheon:춘천시,taebaek:태백시,pyeongchang:평창군,hongcheon:홍천군,hwacheon:화천군,hoengseong:횡성군",
  },
  {
    slug: "chungbuk",
    name: "충북",
    aliases: ["충북", "충청북도"],
    districts:
      "goesan:괴산군,danyang:단양군,boeun:보은군,yeongdong:영동군,okcheon:옥천군,eumseong:음성군,jecheon:제천시,jeungpyeong:증평군,jincheon:진천군,cheongju:청주시,chungju:충주시",
  },
  {
    slug: "chungnam",
    name: "충남",
    aliases: ["충남", "충청남도"],
    districts:
      "gyeryong:계룡시,gongju:공주시,geumsan:금산군,nonsan:논산시,dangjin:당진시,boryeong:보령시,buyeo:부여군,seosan:서산시,seocheon:서천군,asan:아산시,yesan:예산군,cheonan:천안시,cheongyang:청양군,taean:태안군,hongseong:홍성군",
  },
  {
    slug: "jeonbuk",
    name: "전북",
    aliases: [
      "전북",
      "전라북도",
      "전북특별자치도",
    ],
    districts:
      "gochang:고창군,gunsan:군산시,gimje:김제시,namwon:남원시,muju:무주군,buan:부안군,sunchang:순창군,wanju:완주군,iksan:익산시,imsil:임실군,jangsu:장수군,jeonju:전주시,jeongeup:정읍시,jinan:진안군",
  },
  {
    slug: "jeonnam",
    name: "전남",
    aliases: ["전남", "전라남도"],
    districts:
      "gangjin:강진군,goheung:고흥군,gokseong:곡성군,gwangyang:광양시,gurye:구례군,naju:나주시,damyang:담양군,mokpo:목포시,muan:무안군,boseong:보성군,suncheon:순천시,sinan:신안군,yeosu:여수시,yeonggwang:영광군,yeongam:영암군,wando:완도군,jangseong:장성군,jangheung:장흥군,jindo:진도군,hampyeong:함평군,haenam:해남군,hwasun:화순군",
  },
  {
    slug: "gyeongbuk",
    name: "경북",
    aliases: ["경북", "경상북도"],
    districts:
      "gyeongsan:경산시,gyeongju:경주시,goryeong:고령군,gumi:구미시,gimcheon:김천시,mungyeong:문경시,bonghwa:봉화군,sangju:상주시,seongju:성주군,andong:안동시,yeongdeok:영덕군,yeongyang:영양군,yeongju:영주시,yeongcheon:영천시,yecheon:예천군,ulleung:울릉군,uljin:울진군,uiseong:의성군,cheongdo:청도군,cheongsong:청송군,chilgok:칠곡군,pohang:포항시",
  },
  {
    slug: "gyeongnam",
    name: "경남",
    aliases: ["경남", "경상남도"],
    districts:
      "geoje:거제시,geochang:거창군,goseong:고성군,gimhae:김해시,namhae:남해군,miryang:밀양시,sacheon:사천시,sancheong:산청군,yangsan:양산시,uiryeong:의령군,jinju:진주시,changnyeong:창녕군,changwon:창원시,tongyeong:통영시,hadong:하동군,haman:함안군,hamyang:함양군,hapcheon:합천군",
  },
  {
    slug: "jeju",
    name: "제주",
    aliases: [
      "제주",
      "제주도",
      "제주특별자치도",
    ],
    districts:
      "seogwipo:서귀포시,jeju:제주시",
  },
];

/* =========================================
   공통 함수
========================================= */

function normalize(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

function getDistricts(
  region: Region
): District[] {
  if (!region.districts) return [];

  return region.districts
    .split(",")
    .map((entry) => {
      const [slug, name] = entry.split(":");

      return {
        slug,
        name,
      };
    });
}

function makeUrl(
  service: string,
  location: string[] = []
): string {
  const path = [
    "services",
    service,
    ...location,
  ].join("/");

  return `${SITE_URL}/${path}`;
}

/* =========================================
   승인 업체 조회
========================================= */

async function loadCompanies(): Promise<Company[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "사이트맵: Supabase 환경변수가 없습니다."
    );

    return [];
  }

  const companies: Company[] = [];
  const pageSize = 500;

  try {
    for (
      let offset = 0;
      ;
      offset += pageSize
    ) {
      const params = new URLSearchParams({
        select: "id,regions,services",
        limit: String(pageSize),
        offset: String(offset),
      });

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/approved_companies?${params.toString()}`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization:
              `Bearer ${SUPABASE_KEY}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "사이트맵 업체 조회 실패:",
          response.status
        );

        break;
      }

      const rows =
        (await response.json()) as Company[];

      companies.push(...rows);

      if (rows.length < pageSize) {
        break;
      }
    }
  } catch (error) {
    console.error(
      "사이트맵 업체 조회 오류:",
      error
    );
  }

  return companies;
}

/* =========================================
   업체 서비스 일치 여부
========================================= */

function matchesService(
  company: Company,
  service: Service
): boolean {
  return (company.services ?? []).some(
    (registered) =>
      service.matches.some(
        (keyword) =>
          normalize(registered).includes(
            normalize(keyword)
          )
      )
  );
}

/* =========================================
   업체 지역 일치 여부
========================================= */

function getRegionRemainder(
  registered: string,
  region: Region
): string | null {
  const value = normalize(registered);

  const alias = [...region.aliases]
    .sort(
      (a, b) =>
        b.length - a.length
    )
    .find((name) =>
      value.startsWith(
        normalize(name)
      )
    );

  if (!alias) return null;

  return value.slice(
    normalize(alias).length
  );
}

function isWholeArea(
  value: string
): boolean {
  return [
    "",
    "전체",
    "전지역",
    "전역",
  ].includes(value);
}

function matchesRegion(
  company: Company,
  region: Region,
  district?: District
): boolean {
  return (company.regions ?? []).some(
    (registered) => {
      const value =
        normalize(registered);

      if (
        [
          "전국",
          "전국전체",
          "전국전지역",
        ].includes(value)
      ) {
        return true;
      }

      if (
        [
          "seoul",
          "gyeonggi",
          "incheon",
        ].includes(region.slug) &&
        [
          "수도권",
          "수도권전체",
          "수도권전지역",
        ].includes(value)
      ) {
        return true;
      }

      const remainder =
        getRegionRemainder(
          registered,
          region
        );

      if (remainder === null) {
        return false;
      }

      if (isWholeArea(remainder)) {
        return true;
      }

      if (!district) {
        return true;
      }

      return remainder.startsWith(
        normalize(district.name)
      );
    }
  );
}

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
   사이트맵 생성
========================================= */

export async function GET() {
  const companies =
    await loadCompanies();

  const urls =
    new Set<string>();

  for (const service of SERVICES) {
    /*
      1. 서비스 카테고리 기본 페이지
    */

    urls.add(
      makeUrl(service.slug)
    );

    const serviceCompanies =
      companies.filter(
        (company) =>
          matchesService(
            company,
            service
          )
      );

    /*
      2. 전국 17개 시·도 페이지
    */

    for (const region of REGIONS) {
      urls.add(
        makeUrl(
          service.slug,
          [region.slug]
        )
      );

      /*
        3. 등록 업체가 있는 시·군·구만 추가
      */

      for (
        const district of
        getDistricts(region)
      ) {
        const hasCompany =
          serviceCompanies.some(
            (company) =>
              matchesRegion(
                company,
                region,
                district
              )
          );

        if (!hasCompany) {
          continue;
        }

        urls.add(
          makeUrl(
            service.slug,
            [
              region.slug,
              district.slug,
            ]
          )
        );
      }
    }
  }

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...[...urls].map(
      (url) =>
        `  <url><loc>${escapeXml(
          url
        )}</loc></url>`
    ),
    "</urlset>",
  ].join("\n");

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type":
        "application/xml; charset=utf-8",
      "Cache-Control":
        "public, s-maxage=3600, stale-while-revalidate=3600",
    },
  });
}

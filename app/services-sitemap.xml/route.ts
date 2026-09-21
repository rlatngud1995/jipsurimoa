
/* =====================================
   집수리모아 시공 페이지 사이트맵

   https://www.jipsurimoa.com/services-sitemap.xml

   - 시공 카테고리 주소
   - 17개 시·도 주소
   - 해당 시공·지역에 등록 업체가 있는
     시·군·구 주소

   기존 메인 홈페이지 및 sitemap.xml은
   수정하지 않습니다.
===================================== */

const SITE_URL = "https://www.jipsurimoa.com";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type Service = {
  slug: string;
  keywords: string[];
};

const SERVICES: Service[] = [
  {
    slug: "cooktop",
    keywords: ["쿡탑", "인덕션", "가스레인지"],
  },
  {
    slug: "sink",
    keywords: ["싱크볼", "싱크대"],
  },
  {
    slug: "tree",
    keywords: ["벌목", "조경", "나무 제거"],
  },
  {
    slug: "petdoor",
    keywords: ["펫도어"],
  },
  {
    slug: "faucet",
    keywords: ["수전"],
  },
  {
    slug: "aircon",
    keywords: ["에어컨"],
  },
  {
    slug: "refrigerator",
    keywords: ["냉장고 철거"],
  },
  {
    slug: "repair",
    keywords: ["집수리", "종합 집수리"],
  },
];

type Province = {
  slug: string;
  aliases: string[];
  districts: string[];
};

const PROVINCES: Province[] = [
  {
    slug: "seoul",
    aliases: ["서울특별시", "서울시", "서울"],
    districts: [
      "강남구", "강동구", "강북구", "강서구",
      "관악구", "광진구", "구로구", "금천구",
      "노원구", "도봉구", "동대문구", "동작구",
      "마포구", "서대문구", "서초구", "성동구",
      "성북구", "송파구", "양천구", "영등포구",
      "용산구", "은평구", "종로구", "중구",
      "중랑구",
    ],
  },
  {
    slug: "busan",
    aliases: ["부산광역시", "부산시", "부산"],
    districts: [
      "강서구", "금정구", "기장군", "남구",
      "동구", "동래구", "부산진구", "북구",
      "사상구", "사하구", "서구", "수영구",
      "연제구", "영도구", "중구", "해운대구",
    ],
  },
  {
    slug: "daegu",
    aliases: ["대구광역시", "대구시", "대구"],
    districts: [
      "군위군", "남구", "달서구", "달성군",
      "동구", "북구", "서구", "수성구", "중구",
    ],
  },
  {
    slug: "incheon",
    aliases: ["인천광역시", "인천시", "인천"],
    districts: [
      "강화군", "계양구", "남동구", "동구",
      "미추홀구", "부평구", "서구", "연수구",
      "옹진군", "중구",
    ],
  },
  {
    slug: "gwangju",
    aliases: ["광주광역시", "광주"],
    districts: ["광산구", "남구", "동구", "북구", "서구"],
  },
  {
    slug: "daejeon",
    aliases: ["대전광역시", "대전시", "대전"],
    districts: ["대덕구", "동구", "서구", "유성구", "중구"],
  },
  {
    slug: "ulsan",
    aliases: ["울산광역시", "울산시", "울산"],
    districts: ["남구", "동구", "북구", "울주군", "중구"],
  },
  {
    slug: "sejong",
    aliases: ["세종특별자치시", "세종시", "세종"],
    districts: [],
  },
  {
    slug: "gyeonggi",
    aliases: ["경기도", "경기"],
    districts: [
      "가평군", "고양시", "과천시", "광명시",
      "광주시", "구리시", "군포시", "김포시",
      "남양주시", "동두천시", "부천시", "성남시",
      "수원시", "시흥시", "안산시", "안성시",
      "안양시", "양주시", "양평군", "여주시",
      "연천군", "오산시", "용인시", "의왕시",
      "의정부시", "이천시", "파주시", "평택시",
      "포천시", "하남시", "화성시",
    ],
  },
  {
    slug: "gangwon",
    aliases: ["강원특별자치도", "강원도", "강원"],
    districts: [
      "강릉시", "고성군", "동해시", "삼척시",
      "속초시", "양구군", "양양군", "영월군",
      "원주시", "인제군", "정선군", "철원군",
      "춘천시", "태백시", "평창군", "홍천군",
      "화천군", "횡성군",
    ],
  },
  {
    slug: "chungbuk",
    aliases: ["충청북도", "충북"],
    districts: [
      "괴산군", "단양군", "보은군", "영동군",
      "옥천군", "음성군", "제천시", "증평군",
      "진천군", "청주시", "충주시",
    ],
  },
  {
    slug: "chungnam",
    aliases: ["충청남도", "충남"],
    districts: [
      "계룡시", "공주시", "금산군", "논산시",
      "당진시", "보령시", "부여군", "서산시",
      "서천군", "아산시", "예산군", "천안시",
      "청양군", "태안군", "홍성군",
    ],
  },
  {
    slug: "jeonbuk",
    aliases: ["전북특별자치도", "전라북도", "전북"],
    districts: [
      "고창군", "군산시", "김제시", "남원시",
      "무주군", "부안군", "순창군", "완주군",
      "익산시", "임실군", "장수군", "전주시",
      "정읍시", "진안군",
    ],
  },
  {
    slug: "jeonnam",
    aliases: ["전라남도", "전남"],
    districts: [
      "강진군", "고흥군", "곡성군", "광양시",
      "구례군", "나주시", "담양군", "목포시",
      "무안군", "보성군", "순천시", "신안군",
      "여수시", "영광군", "영암군", "완도군",
      "장성군", "장흥군", "진도군", "함평군",
      "해남군", "화순군",
    ],
  },
  {
    slug: "gyeongbuk",
    aliases: ["경상북도", "경북"],
    districts: [
      "경산시", "경주시", "고령군", "구미시",
      "김천시", "문경시", "봉화군", "상주시",
      "성주군", "안동시", "영덕군", "영양군",
      "영주시", "영천시", "예천군", "울릉군",
      "울진군", "의성군", "청도군", "청송군",
      "칠곡군", "포항시",
    ],
  },
  {
    slug: "gyeongnam",
    aliases: ["경상남도", "경남"],
    districts: [
      "거제시", "거창군", "고성군", "김해시",
      "남해군", "밀양시", "사천시", "산청군",
      "양산시", "의령군", "진주시", "창녕군",
      "창원시", "통영시", "하동군", "함안군",
      "함양군", "합천군",
    ],
  },
  {
    slug: "jeju",
    aliases: ["제주특별자치도", "제주도", "제주"],
    districts: ["서귀포시", "제주시"],
  },
];

type CompanyRow = {
  regions: string[] | null;
  services: string[] | null;
};

function compact(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

function matchesService(
  company: CompanyRow,
  service: Service
): boolean {
  return (company.services ?? []).some((registered) => {
    const value = compact(registered);

    return service.keywords.some((keyword) =>
      value.includes(compact(keyword))
    );
  });
}

function isNationwide(value: string): boolean {
  return [
    "전국",
    "전국전체",
    "전국전지역",
    "전국시공",
  ].includes(compact(value));
}

function isCapitalArea(value: string): boolean {
  return [
    "수도권",
    "수도권전체",
    "수도권전지역",
  ].includes(compact(value));
}

function matchesDistrict(
  company: CompanyRow,
  province: Province,
  district: string
): boolean {
  const targetDistrict = compact(district);

  return (company.regions ?? []).some((registered) => {
    const value = compact(registered);

    if (isNationwide(value)) {
      return true;
    }

    if (
      ["seoul", "gyeonggi", "incheon"].includes(
        province.slug
      ) &&
      isCapitalArea(value)
    ) {
      return true;
    }

    const alias = [...province.aliases]
      .sort((a, b) => b.length - a.length)
      .find((item) =>
        value.startsWith(compact(item))
      );

    if (!alias) {
      return false;
    }

    const remaining = value.slice(compact(alias).length);

    if (
      remaining === "" ||
      ["전체", "전지역", "전역"].includes(remaining)
    ) {
      return true;
    }

    return remaining.startsWith(targetDistrict);
  });
}

async function loadCompanies(): Promise<CompanyRow[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase 환경변수가 없습니다.");
  }

  const allRows: CompanyRow[] = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    const query = new URLSearchParams({
      select: "regions,services",
      limit: String(pageSize),
      offset: String(offset),
    });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/approved_companies?${query.toString()}`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error(
        `승인 업체 조회 실패: ${response.status}`
      );
    }

    const rows: unknown = await response.json();

    if (!Array.isArray(rows)) {
      throw new Error("업체 데이터 형식이 올바르지 않습니다.");
    }

    const pageRows = rows as CompanyRow[];
    allRows.push(...pageRows);

    if (pageRows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return allRows;
}

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

  // 기존 시공 카테고리 및 시·도 주소 유지
  for (const service of SERVICES) {
    paths.add(`/services/${service.slug}`);

    for (const province of PROVINCES) {
      paths.add(`/services/${service.slug}/${province.slug}`);
    }
  }

  // 실제 등록 업체와 일치하는 시·군·구 주소 추가
  try {
    const companies = await loadCompanies();

    for (const service of SERVICES) {
      const serviceCompanies = companies.filter(
        (company) => matchesService(company, service)
      );

      if (serviceCompanies.length === 0) {
        continue;
      }

      for (const province of PROVINCES) {
        for (const district of province.districts) {
          const hasCompany = serviceCompanies.some(
            (company) =>
              matchesDistrict(company, province, district)
          );

          if (!hasCompany) {
            continue;
          }

          // 기존 서울 쿡탑 지역 페이지와
          // 중복 등록하지 않도록 이번에는 제외
          if (
            service.slug === "cooktop" &&
            province.slug === "seoul"
          ) {
            continue;
          }

          paths.add(
            `/services/${service.slug}/${province.slug}/${encodeURIComponent(
              district
            )}`
          );
        }
      }
    }
  } catch (error) {
    // 업체 조회가 일시적으로 실패해도
    // 기존 카테고리·시도 사이트맵은 유지
    console.error("지역별 사이트맵 생성 오류:", error);
  }

  const urls = Array.from(paths).map((path) => {
    return `  <url>
    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>
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

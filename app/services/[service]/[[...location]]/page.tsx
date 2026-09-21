
import type { Metadata } from "next";
import Link from "next/link";

/* =====================================
   집수리모아 지역별 시공 업체 페이지

   파일:
   app/services/[service]/[[...location]]/page.tsx

   주소 예시:
   /services/cooktop
   /services/cooktop/seoul
   /services/cooktop/seoul/서초구
   /services/cooktop/seoul/서초구/반포동
===================================== */

const SITE_URL = "https://www.jipsurimoa.com";

const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
)
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type ServiceInfo = {
  slug: string;
  title: string;
  keywords: string[];
  description: string;
};

type ProvinceInfo = {
  slug: string;
  name: string;
  aliases: string[];
  districts: string[];
};

type Company = {
  id: string | number;
  name: string | null;
  description: string | null;
  regions: string[] | null;
  services: string[] | null;
  images: string[] | null;
  website_url: string | null;
};

type PageProps = {
  params: Promise<{
    service: string;
    location?: string[];
  }>;
};

const SERVICES: ServiceInfo[] = [
  {
    slug: "repair",
    title: "종합 집수리",
    keywords: ["종합 집수리", "집수리"],
    description: "주택 및 상가의 다양한 집수리 업체를 찾아보세요.",
  },
  {
    slug: "sink",
    title: "싱크볼 리폼",
    keywords: ["싱크볼", "싱크대"],
    description: "싱크볼 설치·교체 및 주방 리폼 업체를 찾아보세요.",
  },
  {
    slug: "cooktop",
    title: "쿡탑 설치·교체",
    keywords: ["쿡탑", "인덕션", "가스레인지"],
    description: "쿡탑과 인덕션 설치·교체 업체를 찾아보세요.",
  },
  {
    slug: "tree",
    title: "벌목·조경",
    keywords: ["벌목", "조경", "나무 제거"],
    description: "벌목, 위험목 제거 및 조경 업체를 찾아보세요.",
  },
  {
    slug: "aircon",
    title: "에어컨",
    keywords: ["에어컨"],
    description: "에어컨 관련 시공 및 수리 업체를 찾아보세요.",
  },
  {
    slug: "faucet",
    title: "수전 교체",
    keywords: ["수전"],
    description: "주방 및 욕실 수전 설치·교체 업체를 찾아보세요.",
  },
  {
    slug: "petdoor",
    title: "펫도어 설치",
    keywords: ["펫도어"],
    description: "반려동물용 펫도어 설치 업체를 찾아보세요.",
  },
  {
    slug: "refrigerator",
    title: "냉장고 철거",
    keywords: ["냉장고 철거"],
    description: "냉장고 및 냉장고장 철거 업체를 찾아보세요.",
  },
];

const PROVINCES: ProvinceInfo[] = [
  {
    slug: "seoul",
    name: "서울",
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
    name: "부산",
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
    name: "대구",
    aliases: ["대구광역시", "대구시", "대구"],
    districts: [
      "군위군", "남구", "달서구", "달성군",
      "동구", "북구", "서구", "수성구", "중구",
    ],
  },
  {
    slug: "incheon",
    name: "인천",
    aliases: ["인천광역시", "인천시", "인천"],
    districts: [
      "강화군", "계양구", "남동구", "동구",
      "미추홀구", "부평구", "서구", "연수구",
      "옹진군", "중구",
    ],
  },
  {
    slug: "gwangju",
    name: "광주",
    aliases: ["광주광역시", "광주시", "광주"],
    districts: ["광산구", "남구", "동구", "북구", "서구"],
  },
  {
    slug: "daejeon",
    name: "대전",
    aliases: ["대전광역시", "대전시", "대전"],
    districts: ["대덕구", "동구", "서구", "유성구", "중구"],
  },
  {
    slug: "ulsan",
    name: "울산",
    aliases: ["울산광역시", "울산시", "울산"],
    districts: ["남구", "동구", "북구", "울주군", "중구"],
  },
  {
    slug: "sejong",
    name: "세종",
    aliases: ["세종특별자치시", "세종시", "세종"],
    districts: [],
  },
  {
    slug: "gyeonggi",
    name: "경기",
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
    name: "강원",
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
    name: "충북",
    aliases: ["충청북도", "충북"],
    districts: [
      "괴산군", "단양군", "보은군", "영동군",
      "옥천군", "음성군", "제천시", "증평군",
      "진천군", "청주시", "충주시",
    ],
  },
  {
    slug: "chungnam",
    name: "충남",
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
    name: "전북",
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
    name: "전남",
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
    name: "경북",
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
    name: "경남",
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
    name: "제주",
    aliases: ["제주특별자치도", "제주도", "제주"],
    districts: ["서귀포시", "제주시"],
  },
];

/* =====================================
   주소 및 지역 처리
===================================== */

function compact(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

function getLocation(
  location: string[] = []
): string[] {
  return location.map((item) => {
    try {
      return decodeURIComponent(item);
    } catch {
      return item;
    }
  });
}

function getPagePath(
  serviceSlug: string,
  location: string[] = []
): string {
  return [
    "",
    "services",
    serviceSlug,
    ...location.map((item) => encodeURIComponent(item)),
  ].join("/");
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

function getProvinceRemainder(
  registered: string,
  province: ProvinceInfo
): string | null {
  const value = compact(registered);

  const alias = [...province.aliases]
    .sort((a, b) => b.length - a.length)
    .find((name) => value.startsWith(compact(name)));

  if (!alias) return null;

  return value.slice(compact(alias).length);
}

function isWholeArea(value: string): boolean {
  return ["", "전체", "전지역", "전역"].includes(value);
}

function matchesService(
  company: Company,
  service: ServiceInfo
): boolean {
  return (company.services ?? []).some((registered) => {
    const value = compact(registered);

    return service.keywords.some((keyword) =>
      value.includes(compact(keyword))
    );
  });
}

function matchesRegion(
  company: Company,
  province: ProvinceInfo | undefined,
  district: string | undefined,
  neighborhood: string | undefined
): boolean {
  if (!province) return true;

  return (company.regions ?? []).some((registered) => {
    const value = compact(registered);

    if (isNationwide(value)) return true;

    if (
      ["seoul", "gyeonggi", "incheon"].includes(
        province.slug
      ) &&
      isCapitalArea(value)
    ) {
      return true;
    }

    const remainder = getProvinceRemainder(
      registered,
      province
    );

    if (remainder === null) return false;

    // 시·도 전체 등록 업체는 해당 시·도 하위 지역에도 표시
    if (isWholeArea(remainder)) return true;

    // 시·도 페이지
    if (!district) return true;

    const districtValue = compact(district);

    if (!remainder.startsWith(districtValue)) {
      return false;
    }

    const afterDistrict = remainder.slice(
      districtValue.length
    );

    // 시·군·구 페이지
    if (!neighborhood) return true;

    // 시·군·구 전체 등록 업체는 하위 읍·면·동에도 표시
    if (isWholeArea(afterDistrict)) return true;

    return afterDistrict === compact(neighborhood);
  });
}

/* =====================================
   Supabase 승인 업체 조회
===================================== */

async function loadCompanies(): Promise<Company[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Supabase 환경변수가 없습니다.");
    return [];
  }

  const companies: Company[] = [];
  const pageSize = 500;
  let offset = 0;

  try {
    while (true) {
      const params = new URLSearchParams({
        select:
          "id,name,description,regions,services,images,website_url",
        limit: String(pageSize),
        offset: String(offset),
      });

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/approved_companies?${params.toString()}`,
        {
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        console.error(
          "승인 업체 조회 실패:",
          response.status
        );
        return companies;
      }

      const rows = (await response.json()) as Company[];

      companies.push(...rows);

      if (rows.length < pageSize) break;

      offset += pageSize;
    }
  } catch (error) {
    console.error("승인 업체 조회 오류:", error);
  }

  return companies;
}

/* =====================================
   등록 업체의 읍·면·동 추출
===================================== */

function getNeighborhoods(
  companies: Company[],
  province: ProvinceInfo,
  district: string
): string[] {
  const result = new Set<string>();
  const districtValue = compact(district);

  for (const company of companies) {
    for (const registered of company.regions ?? []) {
      const remainder = getProvinceRemainder(
        registered,
        province
      );

      if (
        remainder === null ||
        !remainder.startsWith(districtValue)
      ) {
        continue;
      }

      const neighborhood = remainder.slice(
        districtValue.length
      );

      if (
        /^[가-힣0-9]+(?:동|읍|면)$/.test(neighborhood)
      ) {
        result.add(neighborhood);
      }
    }
  }

  return [...result].sort((a, b) =>
    a.localeCompare(b, "ko")
  );
}

/* =====================================
   페이지 정보
===================================== */

function getPageInfo(
  serviceSlug: string,
  rawLocation: string[] = []
) {
  const service = SERVICES.find(
    (item) => item.slug === serviceSlug
  );

  const location = getLocation(rawLocation);

  const province = PROVINCES.find(
    (item) => item.slug === location[0]
  );

  const district = location[1];
  const neighborhood = location[2];

  const validDistrict =
    !district ||
    !!province?.districts.includes(district);

  const validNeighborhood =
    !neighborhood ||
    (
      !!district &&
      /^[가-힣0-9]+(?:동|읍|면)$/.test(neighborhood)
    );

  const valid =
    !!service &&
    location.length <= 3 &&
    (location.length === 0 || !!province) &&
    validDistrict &&
    validNeighborhood;

  const areaName = [
    province?.name,
    district,
    neighborhood,
  ]
    .filter(Boolean)
    .join(" ");

  const title = service
    ? `${areaName ? `${areaName} ` : ""}${service.title} 업체 찾기`
    : "시공 업체 찾기";

  return {
    service,
    location,
    province,
    district,
    neighborhood,
    valid,
    areaName,
    title,
  };
}

/* =====================================
   검색엔진 메타데이터
===================================== */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const resolved = await params;

  const info = getPageInfo(
    resolved.service,
    resolved.location
  );

  if (!info.valid || !info.service) {
    return {
      title: "페이지를 찾을 수 없습니다 | 집수리모아",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const companies = await loadCompanies();

  const matchedCompanies = companies.filter(
    (company) =>
      matchesService(company, info.service!) &&
      matchesRegion(
        company,
        info.province,
        info.district,
        info.neighborhood
      )
  );

  const canonical = `${SITE_URL}${getPagePath(
    info.service.slug,
    info.location
  )}`;

  /*
    기존 서울 구별 쿡탑 페이지와 중복 방지:
    /seoul/서초구/cooktop 주소를 대표 주소로 사용
  */
  const existingSeoulCooktop =
    info.service.slug === "cooktop" &&
    info.province?.slug === "seoul" &&
    !!info.district;

  const canonicalUrl = existingSeoulCooktop
    ? `${SITE_URL}/seoul/${encodeURIComponent(
        info.district!
      )}/cooktop`
    : canonical;

  return {
    title: `${info.title} | 집수리모아`,
    description: `${info.title}. ${info.service.description} 등록된 업체의 시공 분야와 서비스 지역을 확인하고 업체 정보를 살펴보세요.`,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: {
      index:
        matchedCompanies.length > 0 &&
        !existingSeoulCooktop,
      follow: true,
    },
  };
}

/* =====================================
   화면 스타일
===================================== */

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f9fc",
    color: "#172033",
    padding: "28px 16px 70px",
  } as const,

  container: {
    maxWidth: 1100,
    margin: "0 auto",
  } as const,

  panel: {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 18,
    padding: 22,
    marginBottom: 20,
  } as const,

  link: {
    display: "inline-block",
    padding: "10px 14px",
    border: "1px solid #dce5f0",
    borderRadius: 10,
    color: "#263b59",
    background: "#ffffff",
    textDecoration: "none",
    fontSize: 14,
    fontWeight: 600,
  } as const,

  card: {
    background: "#ffffff",
    border: "1px solid #e5eaf1",
    borderRadius: 16,
    padding: 18,
    overflow: "hidden",
  } as const,
};

/* =====================================
   지역별 시공 업체 페이지
===================================== */

export default async function ServiceLocationPage({
  params,
}: PageProps) {
  const resolved = await params;

  const info = getPageInfo(
    resolved.service,
    resolved.location
  );

  if (!info.valid || !info.service) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>
          <section style={styles.panel}>
            <h1>페이지를 찾을 수 없습니다.</h1>
            <p>시공 종류 또는 지역 주소를 확인해 주세요.</p>
            <Link href="/" style={styles.link}>
              집수리모아 홈으로
            </Link>
          </section>
        </div>
      </main>
    );
  }

  const service = info.service;
  const companies = await loadCompanies();

  const serviceCompanies = companies.filter(
    (company) => matchesService(company, service)
  );

  const matchedCompanies = serviceCompanies.filter(
    (company) =>
      matchesRegion(
        company,
        info.province,
        info.district,
        info.neighborhood
      )
  );

  const neighborhoodNames =
    info.province && info.district
      ? getNeighborhoods(
          serviceCompanies,
          info.province,
          info.district
        )
      : [];

  const currentPath = getPagePath(
    service.slug,
    info.location
  );

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <header style={styles.panel}>
          <Link href="/" style={styles.link}>
            ← 집수리모아 홈
          </Link>

          <p
            style={{
              marginTop: 24,
              marginBottom: 8,
              color: "#4568a0",
              fontWeight: 700,
            }}
          >
            지역별 시공 업체 찾기
          </p>

          <h1
            style={{
              fontSize: "clamp(26px, 5vw, 38px)",
              lineHeight: 1.35,
              margin: "0 0 12px",
            }}
          >
            {info.title}
          </h1>

          <p
            style={{
              color: "#586579",
              lineHeight: 1.8,
              margin: 0,
            }}
          >
            {service.description}
            {" "}
            등록된 업체의 시공 분야와 서비스 지역을
            확인하고 문의해 보세요.
          </p>
        </header>

        <section style={styles.panel}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>
            시공 종류 선택
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 9,
            }}
          >
            {SERVICES.map((item) => (
              <Link
                key={item.slug}
                href={getPagePath(
                  item.slug,
                  info.location
                )}
                style={{
                  ...styles.link,
                  background:
                    item.slug === service.slug
                      ? "#eaf2ff"
                      : "#ffffff",
                  borderColor:
                    item.slug === service.slug
                      ? "#8cb4f2"
                      : "#dce5f0",
                }}
              >
                {item.title}
              </Link>
            ))}
          </div>
        </section>

        <section style={styles.panel}>
          <h2 style={{ marginTop: 0, fontSize: 20 }}>
            지역 선택
          </h2>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 9,
              marginBottom: 18,
            }}
          >
            <Link
              href={getPagePath(service.slug)}
              style={styles.link}
            >
              전국
            </Link>

            {info.province && (
              <Link
                href={getPagePath(service.slug, [
                  info.province.slug,
                ])}
                style={styles.link}
              >
                {info.province.name}
              </Link>
            )}

            {info.province && info.district && (
              <Link
                href={getPagePath(service.slug, [
                  info.province.slug,
                  info.district,
                ])}
                style={styles.link}
              >
                {info.district}
              </Link>
            )}

            {info.neighborhood && (
              <span
                style={{
                  ...styles.link,
                  background: "#eaf2ff",
                }}
              >
                {info.neighborhood}
              </span>
            )}
          </div>

          {!info.province && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 9,
              }}
            >
              {PROVINCES.map((province) => (
                <Link
                  key={province.slug}
                  href={getPagePath(service.slug, [
                    province.slug,
                  ])}
                  style={styles.link}
                >
                  {province.name}
                </Link>
              ))}
            </div>
          )}

          {info.province && !info.district && (
            <>
              <p style={{ color: "#586579" }}>
                {info.province.name}의 시·군·구를 선택하세요.
              </p>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 9,
                }}
              >
                {info.province.districts.map(
                  (district) => (
                    <Link
                      key={district}
                      href={getPagePath(
                        service.slug,
                        [
                          info.province!.slug,
                          district,
                        ]
                      )}
                      style={styles.link}
                    >
                      {district}
                    </Link>
                  )
                )}
              </div>
            </>
          )}

          {info.province &&
            info.district &&
            !info.neighborhood && (
              <>
                <p style={{ color: "#586579" }}>
                  등록 업체가 지역 정보에 명시한
                  읍·면·동을 선택할 수 있습니다.
                </p>

                {neighborhoodNames.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 9,
                    }}
                  >
                    {neighborhoodNames.map(
                      (neighborhood) => (
                        <Link
                          key={neighborhood}
                          href={getPagePath(
                            service.slug,
                            [
                              info.province!.slug,
                              info.district!,
                              neighborhood,
                            ]
                          )}
                          style={styles.link}
                        >
                          {neighborhood}
                        </Link>
                      )
                    )}
                  </div>
                ) : (
                  <p style={{ color: "#586579" }}>
                    현재 별도로 등록된 읍·면·동
                    정보가 없습니다. 아래에서
                    해당 시·군·구의 업체를 확인하세요.
                  </p>
                )}
              </>
            )}
        </section>

        <section style={styles.panel}>
          <h2
            style={{
              marginTop: 0,
              marginBottom: 8,
              fontSize: 22,
            }}
          >
            {info.areaName
              ? `${info.areaName} 등록 업체`
              : "등록 업체"}
          </h2>

          <p
            style={{
              marginTop: 0,
              color: "#586579",
            }}
          >
            {service.title} · {matchedCompanies.length}곳
          </p>

          {matchedCompanies.length === 0 ? (
            <div
              style={{
                padding: "30px 12px",
                textAlign: "center",
                color: "#586579",
                background: "#f7f9fc",
                borderRadius: 12,
              }}
            >
              <p style={{ fontWeight: 700 }}>
                현재 조건에 맞는 등록 업체가 없습니다.
              </p>
              <p>
                상위 지역을 선택하거나 다른 시공
                종류를 확인해 주세요.
              </p>

              <Link
                href={
                  info.province
                    ? getPagePath(service.slug, [
                        info.province.slug,
                      ])
                    : getPagePath(service.slug)
                }
                style={styles.link}
              >
                상위 지역 업체 보기
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                gap: 16,
                marginTop: 20,
              }}
            >
              {matchedCompanies.map((company) => {
                const image = (company.images ?? []).find(
                  (item) =>
                    typeof item === "string" &&
                    /^https?:\/\//i.test(item)
                );

                const website =
                  company.website_url &&
                  /^https?:\/\//i.test(
                    company.website_url
                  )
                    ? company.website_url
                    : null;

                return (
                  <article
                    key={String(company.id)}
                    style={styles.card}
                  >
                    {image && (
                      <div
                        style={{
                          height: 190,
                          overflow: "hidden",
                          borderRadius: 12,
                          marginBottom: 16,
                          background: "#edf1f7",
                        }}
                      >
                        {/* 외부 Supabase 이미지 호환 */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image}
                          alt={`${company.name ?? "시공 업체"} 대표 사진`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    )}

                    <h3
                      style={{
                        margin: "0 0 10px",
                        fontSize: 21,
                      }}
                    >
                      {company.name ?? "등록 업체"}
                    </h3>

                    <p
                      style={{
                        color: "#586579",
                        lineHeight: 1.7,
                        whiteSpace: "pre-line",
                        overflowWrap: "anywhere",
                      }}
                    >
                      {company.description ||
                        "업체 소개가 등록되지 않았습니다."}
                    </p>

                    <p
                      style={{
                        color: "#586579",
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      <strong>시공 분야</strong>
                      <br />
                      {(company.services ?? []).join(
                        " · "
                      ) || "미등록"}
                    </p>

                    <p
                      style={{
                        color: "#586579",
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      <strong>서비스 지역</strong>
                      <br />
                      {(company.regions ?? []).join(
                        " · "
                      ) || "미등록"}
                    </p>

                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          ...styles.link,
                          display: "block",
                          textAlign: "center",
                          marginTop: 16,
                          background: "#2563eb",
                          color: "#ffffff",
                          borderColor: "#2563eb",
                        }}
                      >
                        업체 홈페이지 바로가기 →
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <footer
          style={{
            textAlign: "center",
            color: "#748094",
            fontSize: 13,
            paddingTop: 14,
          }}
        >
          <Link href="/" style={styles.link}>
            집수리모아 홈으로 돌아가기
          </Link>
          <p style={{ marginTop: 18 }}>
            현재 페이지: {currentPath}
          </p>
        </footer>
      </div>
    </main>
  );
}

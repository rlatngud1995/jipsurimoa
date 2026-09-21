
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/* =====================================
   기본 설정
===================================== */

const SITE_URL = "https://www.jipsurimoa.com";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

/* =====================================
   시공 카테고리

   slug: 페이지 주소
   name: 화면에 표시할 이름
   keywords: 등록 업체의 services와 비교
===================================== */

const SERVICE_CATEGORIES = [
  {
    slug: "cooktop",
    name: "쿡탑교체",
    keywords: [
      "쿡탑",
      "인덕션",
      "가스레인지",
      "가스렌지",
    ],
  },
  {
    slug: "sink",
    name: "싱크볼교체",
    keywords: [
      "싱크볼",
      "싱크대",
      "사각싱크볼",
    ],
  },
  {
    slug: "tree",
    name: "벌목",
    keywords: [
      "벌목",
      "나무제거",
      "위험목",
      "수목제거",
    ],
  },
  {
    slug: "petdoor",
    name: "펫도어 시공",
    keywords: ["펫도어", "반려동물출입문"],
  },
  {
    slug: "faucet",
    name: "수전교체",
    keywords: ["수전", "수도꼭지"],
  },
  {
    slug: "aircon",
    name: "에어컨 배선 보수",
    keywords: [
      "에어컨배선",
      "에어컨테이핑",
      "배관테이핑",
      "에어컨보온재",
    ],
  },
  {
    slug: "refrigerator",
    name: "냉장고 철거",
    keywords: ["냉장고철거", "냉장고장철거"],
  },
  {
    slug: "repair",
    name: "집수리",
    keywords: ["집수리", "종합수리"],
  },
] as const;

/* =====================================
   전국 시·도

   slug는 영문 주소로 사용
===================================== */

const PROVINCES = [
  { slug: "seoul", name: "서울", aliases: ["서울특별시", "서울시"] },
  { slug: "busan", name: "부산", aliases: ["부산광역시", "부산시"] },
  { slug: "daegu", name: "대구", aliases: ["대구광역시", "대구시"] },
  { slug: "incheon", name: "인천", aliases: ["인천광역시", "인천시"] },
  { slug: "gwangju", name: "광주", aliases: ["광주광역시", "광주시"] },
  { slug: "daejeon", name: "대전", aliases: ["대전광역시", "대전시"] },
  { slug: "ulsan", name: "울산", aliases: ["울산광역시", "울산시"] },
  { slug: "sejong", name: "세종", aliases: ["세종특별자치시", "세종시"] },
  { slug: "gyeonggi", name: "경기", aliases: ["경기도"] },
  { slug: "gangwon", name: "강원", aliases: ["강원특별자치도", "강원도"] },
  { slug: "chungbuk", name: "충북", aliases: ["충청북도"] },
  { slug: "chungnam", name: "충남", aliases: ["충청남도"] },
  { slug: "jeonbuk", name: "전북", aliases: ["전북특별자치도", "전라북도"] },
  { slug: "jeonnam", name: "전남", aliases: ["전라남도"] },
  { slug: "gyeongbuk", name: "경북", aliases: ["경상북도"] },
  { slug: "gyeongnam", name: "경남", aliases: ["경상남도"] },
  { slug: "jeju", name: "제주", aliases: ["제주특별자치도"] },
] as const;

/* =====================================
   서울 25개 구

   다른 시·군·구와 읍·면·동은
   아래 getRegisteredSubregions()에서
   업체 등록 지역을 기반으로 연결
===================================== */

const SEOUL_DISTRICTS = [
  "강남구",
  "강동구",
  "강북구",
  "강서구",
  "관악구",
  "광진구",
  "구로구",
  "금천구",
  "노원구",
  "도봉구",
  "동대문구",
  "동작구",
  "마포구",
  "서대문구",
  "서초구",
  "성동구",
  "성북구",
  "송파구",
  "양천구",
  "영등포구",
  "용산구",
  "은평구",
  "종로구",
  "중구",
  "중랑구",
];

/* =====================================
   데이터 타입
===================================== */

type Company = {
  id: string;
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

/* =====================================
   공통 함수
===================================== */

function normalize(value: string): string {
  return value.replace(/\s+/g, "").toLowerCase();
}

function getService(slug: string) {
  return SERVICE_CATEGORIES.find(
    (item) => item.slug === slug
  );
}

function getProvince(slug: string) {
  return PROVINCES.find(
    (item) => item.slug === slug
  );
}

function matchesService(
  company: Company,
  keywords: readonly string[]
): boolean {
  return (company.services ?? []).some((service) => {
    const value = normalize(service);

    return keywords.some((keyword) =>
      value.includes(normalize(keyword))
    );
  });
}

function provinceNames(
  province: (typeof PROVINCES)[number]
): string[] {
  return [province.name, ...province.aliases];
}

function isProvinceWide(
  value: string,
  province: (typeof PROVINCES)[number]
): boolean {
  const normalized = normalize(value);

  return provinceNames(province).some((name) => {
    const p = normalize(name);

    return [
      p,
      `${p}전지역`,
      `${p}전체`,
      `${p}전역`,
    ].includes(normalized);
  });
}

function isNationwide(value: string): boolean {
  return [
    "전국",
    "전국전지역",
    "전국전체",
    "전국시공",
  ].includes(normalize(value));
}

function isCapitalArea(
  value: string,
  provinceSlug: string
): boolean {
  return (
    ["seoul", "incheon", "gyeonggi"].includes(
      provinceSlug
    ) &&
    [
      "수도권",
      "수도권전지역",
      "수도권전체",
    ].includes(normalize(value))
  );
}

/*
  업체 지역 등록 예시:
  서울
  서울 전 지역
  서울 서초구
  서울 서초구 서초동

  다른 시·도에 있는 같은 이름의 구가
  서울 페이지에 잘못 표시되지 않도록
  시·도 이름부터 확인한다.
*/

function matchesRegion(
  company: Company,
  province: (typeof PROVINCES)[number],
  district?: string,
  neighborhood?: string
): boolean {
  return (company.regions ?? []).some((rawRegion) => {
    const value = normalize(rawRegion);

    if (
      isNationwide(value) ||
      isCapitalArea(value, province.slug) ||
      isProvinceWide(value, province)
    ) {
      return true;
    }

    const matchingProvinceName = provinceNames(
      province
    ).find((name) =>
      value.startsWith(normalize(name))
    );

    if (!matchingProvinceName) {
      return false;
    }

    const remainder = value.slice(
      normalize(matchingProvinceName).length
    );

    if (!district) {
      return true;
    }

    const districtValue = normalize(district);

    if (!remainder.startsWith(districtValue)) {
      return false;
    }

    const afterDistrict = remainder.slice(
      districtValue.length
    );

    if (
      !neighborhood ||
      afterDistrict === "" ||
      ["전지역", "전체", "전역"].includes(afterDistrict)
    ) {
      return true;
    }

    return afterDistrict.startsWith(
      normalize(neighborhood)
    );
  });
}

function getWebsiteUrl(
  value: string | null
): string | null {
  if (!value?.trim()) return null;

  try {
    const url = new URL(value.trim());

    if (
      !["http:", "https:"].includes(url.protocol) ||
      !url.hostname.includes(".") ||
      url.username ||
      url.password
    ) {
      return null;
    }

    return url.toString();
  } catch {
    return null;
  }
}

/* =====================================
   승인 업체 조회
===================================== */

async function getApprovedCompanies(): Promise<Company[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다."
    );
  }

  const companies: Company[] = [];
  const pageSize = 500;
  let offset = 0;

  while (true) {
    const query = new URLSearchParams({
      select:
        "id,name,description,regions,services,images,website_url",
      order: "id.asc",
      limit: String(pageSize),
      offset: String(offset),
    });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/approved_companies?${query}`,
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
        `업체 조회 실패 (${response.status})`
      );
    }

    const rows = (await response.json()) as Company[];

    companies.push(...rows);

    if (rows.length < pageSize) break;

    offset += pageSize;
  }

  return companies;
}

/* =====================================
   등록 지역에서 하위 지역 추출

   현재 등록된 업체의 regions에
   명시된 지역을 링크로 표시한다.
===================================== */

function getRegisteredSubregions(
  companies: Company[],
  province: (typeof PROVINCES)[number],
  district?: string
): string[] {
  const found = new Set<string>();

  for (const company of companies) {
    for (const rawRegion of company.regions ?? []) {
      const compact = rawRegion.trim().replace(/\s+/g, " ");

      const prefix = provinceNames(province).find(
        (name) =>
          normalize(compact).startsWith(normalize(name))
      );

      if (!prefix) continue;

      let remainder = compact
        .slice(prefix.length)
        .trim();

      if (!remainder) continue;

      if (district) {
        if (
          !normalize(remainder).startsWith(
            normalize(district)
          )
        ) {
          continue;
        }

        remainder = remainder
          .slice(district.length)
          .trim();
      }

      const nextPart = remainder.split(/\s+/)[0];

      if (
        nextPart &&
        !["전지역", "전체", "전역"].includes(
          nextPart
        )
      ) {
        found.add(nextPart);
      }
    }
  }

  return Array.from(found).sort((a, b) =>
    a.localeCompare(b, "ko")
  );
}

/* =====================================
   주소 생성
===================================== */

function getPagePath(
  service: string,
  location: string[] = []
): string {
  const parts = [
    "services",
    service,
    ...location.map(encodeURIComponent),
  ];

  return `/${parts.join("/")}`;
}

/* =====================================
   메타데이터
===================================== */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { service, location = [] } = await params;

  const category = getService(service);

  if (!category || location.length > 3) {
    return {
      title: "페이지를 찾을 수 없습니다",
      robots: { index: false, follow: false },
    };
  }

  const province = location[0]
    ? getProvince(location[0])
    : undefined;

  if (location.length > 0 && !province) {
    return {
      title: "지역을 찾을 수 없습니다",
      robots: { index: false, follow: false },
    };
  }

  const district = location[1]
    ? decodeURIComponent(location[1])
    : "";

  const neighborhood = location[2]
    ? decodeURIComponent(location[2])
    : "";

  const areaName = [
    province?.name,
    district,
    neighborhood,
  ]
    .filter(Boolean)
    .join(" ");

  const title = areaName
    ? `${areaName} ${category.name} 업체 찾기 | 집수리모아`
    : `${category.name} 업체 찾기 | 집수리모아`;

  const description = areaName
    ? `${areaName} ${category.name} 관련 등록 업체와 시공사진을 집수리모아에서 확인해 보세요.`
    : `${category.name} 시공 분야별 등록 업체와 시공사진을 집수리모아에서 확인해 보세요.`;

  const canonical =
    SITE_URL + getPagePath(service, location);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
  };
}

/* =====================================
   지역·시공별 페이지
===================================== */

export default async function ServiceRegionPage({
  params,
}: PageProps) {
  const { service, location = [] } = await params;

  const category = getService(service);

  if (!category || location.length > 3) {
    notFound();
  }

  const province = location[0]
    ? getProvince(location[0])
    : undefined;

  if (location.length > 0 && !province) {
    notFound();
  }

  const district = location[1]
    ? decodeURIComponent(location[1])
    : undefined;

  const neighborhood = location[2]
    ? decodeURIComponent(location[2])
    : undefined;

  const allCompanies = await getApprovedCompanies();

  const serviceCompanies = allCompanies.filter(
    (company) =>
      matchesService(company, category.keywords)
  );

  const companies = province
    ? serviceCompanies.filter((company) =>
        matchesRegion(
          company,
          province,
          district,
          neighborhood
        )
      )
    : serviceCompanies;

  const areaName = [
    province?.name,
    district,
    neighborhood,
  ]
    .filter(Boolean)
    .join(" ");

  const heading = areaName
    ? `${areaName} ${category.name}`
    : category.name;

  const currentPath = getPagePath(
    service,
    location
  );

  let subregions: string[] = [];

  if (province && !neighborhood) {
    subregions = getRegisteredSubregions(
      serviceCompanies,
      province,
      district
    );

    if (province.slug === "seoul" && !district) {
      subregions = Array.from(
        new Set([
          ...SEOUL_DISTRICTS,
          ...subregions,
        ])
      );
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #e5e7eb",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#172033",
              fontSize: 22,
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            🏠 집수리모아
          </Link>

          <Link
            href="/companies"
            style={{
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            전체 업체 보기
          </Link>
        </div>
      </header>

      <section
        style={{
          background:
            "linear-gradient(135deg, #eff6ff, #ffffff)",
          padding: "55px 20px",
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: "0 auto",
          }}
        >
          <p
            style={{
              color: "#2563eb",
              fontWeight: 700,
            }}
          >
            집수리모아 시공 카테고리
          </p>

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 42px)",
              lineHeight: 1.35,
            }}
          >
            {heading} 업체 찾기
          </h1>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.8,
            }}
          >
            {areaName || "전국"} 지역의{" "}
            {category.name} 관련 등록 업체와
            시공사진을 확인하고 업체 상세
            페이지로 이동할 수 있습니다.
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              marginTop: 22,
            }}
          >
            <Link href="/">홈</Link>
            <span>›</span>

            <Link
              href={getPagePath(service)}
            >
              {category.name}
            </Link>

            {province && (
              <>
                <span>›</span>
                <Link
                  href={getPagePath(service, [
                    province.slug,
                  ])}
                >
                  {province.name}
                </Link>
              </>
            )}

            {district && province && (
              <>
                <span>›</span>
                <Link
                  href={getPagePath(service, [
                    province.slug,
                    district,
                  ])}
                >
                  {district}
                </Link>
              </>
            )}

            {neighborhood && (
              <>
                <span>›</span>
                <span>{neighborhood}</span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 시공 카테고리 선택 */}

      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "35px 20px 15px",
        }}
      >
        <h2>다른 시공 카테고리</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
          }}
        >
          {SERVICE_CATEGORIES.map((item) => (
            <Link
              key={item.slug}
              href={getPagePath(item.slug)}
              style={{
                padding: "11px 15px",
                background:
                  item.slug === service
                    ? "#2563eb"
                    : "#ffffff",
                color:
                  item.slug === service
                    ? "#ffffff"
                    : "#2563eb",
                border: "1px solid #dbeafe",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 700,
              }}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </section>

      {/* 시·도 선택 */}

      {!province && (
        <section
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <h2>지역 선택 · 시도</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 150px), 1fr))",
              gap: 12,
            }}
          >
            {PROVINCES.map((item) => (
              <Link
                key={item.slug}
                href={getPagePath(service, [
                  item.slug,
                ])}
                style={{
                  background: "#ffffff",
                  border: "1px solid #dbeafe",
                  borderRadius: 12,
                  padding: 18,
                  color: "#2563eb",
                  textDecoration: "none",
                  textAlign: "center",
                  fontWeight: 700,
                }}
              >
                {item.name} {category.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 시·군·구 / 읍·면·동 선택 */}

      {province && !neighborhood && (
        <section
          style={{
            maxWidth: 1100,
            margin: "0 auto",
            padding: "20px",
          }}
        >
          <h2>
            {district
              ? `${district} 읍·면·동 선택`
              : `${province.name} 시·군·구 선택`}
          </h2>

          {subregions.length === 0 ? (
            <p style={{ color: "#64748b" }}>
              현재 등록된 세부 지역이 없습니다.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              {subregions.map((item) => (
                <Link
                  key={item}
                  href={getPagePath(service, [
                    province.slug,
                    ...(district ? [district] : []),
                    item,
                  ])}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #dbeafe",
                    borderRadius: 10,
                    padding: "12px 16px",
                    color: "#2563eb",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  {item} {category.name}
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 업체 목록 및 시공사진 */}

      <section
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "35px 20px 60px",
        }}
      >
        <h2>{heading} 등록 업체</h2>

        <p style={{ color: "#64748b" }}>
          현재 조건에 맞는 등록 업체{" "}
          <strong>{companies.length}곳</strong>
        </p>

        {companies.length === 0 ? (
          <div
            style={{
              marginTop: 22,
              padding: 30,
              border: "1px solid #e5e7eb",
              borderRadius: 16,
              background: "#ffffff",
            }}
          >
            <h3>현재 표시할 업체가 없습니다.</h3>
            <p>
              해당 지역과 시공 분야에 맞는 업체가
              등록되면 이곳에 표시됩니다.
            </p>

            <Link href="/companies">
              다른 업체 찾아보기 →
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
              gap: 20,
              marginTop: 24,
            }}
          >
            {companies.map((company) => {
              const image = company.images?.find(
                (item) =>
                  typeof item === "string" &&
                  item.trim()
              );

              const website = getWebsiteUrl(
                company.website_url
              );

              return (
                <article
                  key={company.id}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 16,
                    overflow: "hidden",
                  }}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={`${company.name ?? "업체"} 시공사진`}
                      loading="lazy"
                      style={{
                        width: "100%",
                        height: 190,
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 190,
                        display: "grid",
                        placeItems: "center",
                        background: "#eff6ff",
                        fontSize: 48,
                      }}
                    >
                      🏠
                    </div>
                  )}

                  <div style={{ padding: 22 }}>
                    <h3>
                      {company.name || "등록 업체"}
                    </h3>

                    <p
                      style={{
                        color: "#475569",
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {company.description ||
                        "업체 상세 페이지에서 시공 정보를 확인해 주세요."}
                    </p>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: 14,
                      }}
                    >
                      📍{" "}
                      {company.regions?.join(", ") ||
                        "지역 문의"}
                    </p>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: 14,
                      }}
                    >
                      🛠️{" "}
                      {company.services?.join(", ") ||
                        "시공 분야 문의"}
                    </p>

                    <Link
                      href={`/companies/${encodeURIComponent(
                        company.id
                      )}`}
                      style={{
                        display: "block",
                        padding: "13px 16px",
                        background: "#2563eb",
                        color: "#ffffff",
                        borderRadius: 10,
                        textAlign: "center",
                        textDecoration: "none",
                        fontWeight: 700,
                        marginTop: 18,
                      }}
                    >
                      시공사진 · 업체 상세보기
                    </Link>

                    {website && (
                      <a
                        href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: "block",
                          padding: "12px 16px",
                          border: "1px solid #2563eb",
                          color: "#2563eb",
                          borderRadius: 10,
                          textAlign: "center",
                          textDecoration: "none",
                          fontWeight: 700,
                          marginTop: 10,
                        }}
                      >
                        업체 홈페이지 방문
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <p
          style={{
            color: "#64748b",
            fontSize: 13,
            marginTop: 30,
          }}
        >
          업체별 작업 가능 지역과 시공 가능 여부는
          현장 조건에 따라 달라질 수 있으므로
          업체에 직접 확인해 주세요.
        </p>

        <Link href={currentPath}>
          ↑ 현재 페이지 맨 위로
        </Link>
      </section>
    </main>
  );
}

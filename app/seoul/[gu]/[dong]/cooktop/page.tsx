
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/* =====================================
   기본 설정
===================================== */

const SITE_URL =
  "https://www.jipsurimoa.com";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?.trim() ?? "";

/* =====================================
   서울 25개 구
===================================== */

const DISTRICTS = [
  { slug: "gangnam-gu", name: "강남구" },
  { slug: "gangdong-gu", name: "강동구" },
  { slug: "gangbuk-gu", name: "강북구" },
  { slug: "gangseo-gu", name: "강서구" },
  { slug: "gwanak-gu", name: "관악구" },
  { slug: "gwangjin-gu", name: "광진구" },
  { slug: "guro-gu", name: "구로구" },
  { slug: "geumcheon-gu", name: "금천구" },
  { slug: "nowon-gu", name: "노원구" },
  { slug: "dobong-gu", name: "도봉구" },
  { slug: "dongdaemun-gu", name: "동대문구" },
  { slug: "dongjak-gu", name: "동작구" },
  { slug: "mapo-gu", name: "마포구" },
  { slug: "seodaemun-gu", name: "서대문구" },
  { slug: "seocho-gu", name: "서초구" },
  { slug: "seongdong-gu", name: "성동구" },
  { slug: "seongbuk-gu", name: "성북구" },
  { slug: "songpa-gu", name: "송파구" },
  { slug: "yangcheon-gu", name: "양천구" },
  { slug: "yeongdeungpo-gu", name: "영등포구" },
  { slug: "yongsan-gu", name: "용산구" },
  { slug: "eunpyeong-gu", name: "은평구" },
  { slug: "jongno-gu", name: "종로구" },
  { slug: "jung-gu", name: "중구" },
  { slug: "jungnang-gu", name: "중랑구" },
] as const;

/* =====================================
   기존 영등포구 주소 유지

   기존에 만든 영문 주소가
   끊어지지 않도록 연결
===================================== */

const LEGACY_DONGS: Record<
  string,
  string
> = {
  "yeongdeungpo-dong": "영등포동",
  "yeongdeungpo-bon-dong": "영등포본동",
  "yeouido-dong": "여의도동",
  "yeoui-dong": "여의동",
  "dangsan-dong": "당산동",
  "dangsan-1-dong": "당산1동",
  "dangsan-2-dong": "당산2동",
  "dorim-dong": "도림동",
  "mullae-dong": "문래동",
  "yangpyeong-dong": "양평동",
  "yangpyeong-1-dong": "양평1동",
  "yangpyeong-2-dong": "양평2동",
  "singil-dong": "신길동",
  "singil-1-dong": "신길1동",
  "singil-3-dong": "신길3동",
  "singil-4-dong": "신길4동",
  "singil-5-dong": "신길5동",
  "singil-6-dong": "신길6동",
  "singil-7-dong": "신길7동",
  "daerim-dong": "대림동",
  "daerim-1-dong": "대림1동",
  "daerim-2-dong": "대림2동",
  "daerim-3-dong": "대림3동",
};

/* =====================================
   페이지 타입
===================================== */

type PageProps = {
  params: Promise<{
    gu: string;
    dong: string;
  }>;
};

type Company = {
  id: string;
  name: string | null;
  description: string | null;
  regions: string[] | null;
  services: string[] | null;
  images: string[] | null;
  website_url: string | null;
};

type Area = {
  guSlug: string;
  guName: string;
  dongSlug: string;
  dongName: string;
};

/* =====================================
   문자 정리
===================================== */

function normalize(
  value: string
): string {
  return value
    .replace(/\s+/g, "")
    .toLowerCase();
}

/* =====================================
   지역 주소 해석

   기존 영등포구 영문 주소 지원

   새 지역은 한글 동 이름을
   주소에 사용 가능

   예:
   /seoul/gangnam-gu/역삼동/cooktop
===================================== */

function getArea(
  guSlug: string,
  dongSlug: string
): Area | null {
  const district = DISTRICTS.find(
    (item) => item.slug === guSlug
  );

  if (!district) {
    return null;
  }

  let dongName = "";

  if (
    guSlug === "yeongdeungpo-gu" &&
    LEGACY_DONGS[dongSlug]
  ) {
    dongName = LEGACY_DONGS[dongSlug];
  } else {
    try {
      dongName = decodeURIComponent(
        dongSlug
      ).trim();
    } catch {
      return null;
    }
  }

  // 임의의 문자열이나 경로가
  // 동 이름으로 처리되지 않도록 제한
  if (
    !/^[가-힣]{1,12}(?:[0-9]{1,2})?동$/.test(
      dongName
    )
  ) {
    return null;
  }

  return {
    guSlug: district.slug,
    guName: district.name,
    dongSlug,
    dongName,
  };
}

/* =====================================
   서울 전체 작업 여부
===================================== */

function coversAllSeoul(
  region: string
): boolean {
  const value = normalize(region);

  const allSeoul = new Set([
    "서울",
    "서울시",
    "서울특별시",
    "서울전체",
    "서울전지역",
    "서울전역",
    "서울시전체",
    "서울시전지역",
    "서울특별시전체",
    "서울특별시전지역",
    "수도권",
    "수도권전체",
    "수도권전지역",
  ]);

  return allSeoul.has(value);
}

/* =====================================
   특정 구 전체 작업 여부
===================================== */

function coversDistrict(
  region: string,
  guName: string
): boolean {
  const value = normalize(region);

  const names = [
    guName,
    `서울${guName}`,
    `서울시${guName}`,
    `서울특별시${guName}`,
  ];

  const suffixes = [
    "",
    "전체",
    "전지역",
    "전역",
  ];

  return names.some((name) =>
    suffixes.some(
      (suffix) =>
        value ===
        normalize(`${name}${suffix}`)
    )
  );
}

/* =====================================
   특정 동 작업 여부

   예:
   서울 영등포구 여의도동
   영등포구 여의도동
   여의도동

   구가 명시된 경우 다른 구에
   잘못 표시되지 않도록 확인
===================================== */

function coversDong(
  region: string,
  area: Area
): boolean {
  const value = normalize(region);

  const dongName =
    normalize(area.dongName);

  const guName =
    normalize(area.guName);

  const allDistrictNames =
    DISTRICTS.map(
      (district) =>
        normalize(district.name)
    );

  const mentionedDistricts =
    allDistrictNames.filter(
      (name) =>
        value.includes(name)
    );

  if (
    mentionedDistricts.length > 0 &&
    !mentionedDistricts.includes(
      guName
    )
  ) {
    return false;
  }

  const aliases = [
    dongName,
  ];

  // 기존 영등포구 여의도동·여의동
  // 주소 간 연결 유지
  if (
    area.guName === "영등포구" &&
    ["여의도동", "여의동"].includes(
      area.dongName
    )
  ) {
    aliases.push(
      "여의도동",
      "여의동"
    );
  }

  return aliases.some(
    (name) =>
      value === name ||
      value === `${guName}${name}` ||
      value === `서울${guName}${name}` ||
      value === `서울시${guName}${name}` ||
      value ===
        `서울특별시${guName}${name}`
  );
}

/* =====================================
   업체가 해당 동에서 작업하는지 확인
===================================== */

function servesArea(
  regions: string[] | null,
  area: Area
): boolean {
  if (!Array.isArray(regions)) {
    return false;
  }

  return regions.some(
    (region) =>
      coversAllSeoul(region) ||
      coversDistrict(
        region,
        area.guName
      ) ||
      coversDong(region, area)
  );
}

/* =====================================
   쿡탑 설치·교체 업체 확인
===================================== */

function installsCooktops(
  services: string[] | null
): boolean {
  if (!Array.isArray(services)) {
    return false;
  }

  return services.some((service) => {
    const value =
      normalize(service);

    return (
      value.includes("쿡탑") ||
      value.includes("인덕션") ||
      value.includes("가스레인지") ||
      value.includes("가스렌지")
    );
  });
}

/* =====================================
   외부 홈페이지 주소 확인
===================================== */

function getWebsiteUrl(
  value: string | null
): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(
      value.trim()
    );

    if (
      !["https:", "http:"].includes(
        url.protocol
      ) ||
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
   승인된 업체 불러오기

   업체가 추가되어도 자동 반영
===================================== */

async function getCompanies(
  area: Area
): Promise<Company[]> {
  if (
    !SUPABASE_URL ||
    !SUPABASE_KEY
  ) {
    throw new Error(
      "Supabase 환경변수가 없습니다."
    );
  }

  const matched: Company[] = [];

  const pageSize = 500;
  let offset = 0;

  while (true) {
    const query =
      new URLSearchParams({
        select:
          "id,name,description,regions,services,images,website_url",
        order: "id.asc",
        limit: String(pageSize),
        offset: String(offset),
      });

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/approved_companies?${query.toString()}`,
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
      throw new Error(
        `업체 조회 실패 (${response.status})`
      );
    }

    const rows: Company[] =
      await response.json();

    if (!Array.isArray(rows)) {
      throw new Error(
        "업체 데이터 형식이 올바르지 않습니다."
      );
    }

    matched.push(
      ...rows.filter(
        (company) =>
          servesArea(
            company.regions,
            area
          ) &&
          installsCooktops(
            company.services
          )
      )
    );

    if (
      rows.length < pageSize
    ) {
      break;
    }

    offset += pageSize;
  }

  return matched;
}

/* =====================================
   검색엔진 정보

   동별 페이지는 실제 행정구역
   목록 검증 및 고유 콘텐츠 작업 전까지
   색인 제외

   기존 영등포구 페이지 주소는 유지
===================================== */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { gu, dong } =
    await params;

  const area = getArea(
    gu,
    dong
  );

  if (!area) {
    return {
      title:
        "지역을 찾을 수 없습니다 | 집수리모아",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title =
    `서울 ${area.guName} ${area.dongName} 쿡탑 설치·교체 업체 찾기 | 집수리모아`;

  const description =
    `서울 ${area.guName} ${area.dongName}에서 쿡탑 설치·교체 작업을 하는 등록 업체를 확인하세요. 업체별 서비스 지역과 홈페이지를 확인할 수 있습니다.`;

  const pageUrl =
    `${SITE_URL}/seoul/${area.guSlug}/${encodeURIComponent(
      area.dongSlug
    )}/cooktop`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: false,
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
    },
  };
}

/* =====================================
   서울 동별 쿡탑교체 페이지
===================================== */

export default async function DongCooktopPage({
  params,
}: PageProps) {
  const { gu, dong } =
    await params;

  const area = getArea(
    gu,
    dong
  );

  if (!area) {
    notFound();
  }

  const companies =
    await getCompanies(area);

  const districtUrl =
    `/seoul/${area.guSlug}/cooktop`;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        color: "#172033",
      }}
    >
      {/* 상단 메뉴 */}

      <header
        style={{
          background: "#ffffff",
          borderBottom:
            "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#172033",
              fontSize: "22px",
              fontWeight: 800,
              textDecoration: "none",
            }}
          >
            🏠 집수리모아
          </Link>

          <Link
            href={districtUrl}
            style={{
              color: "#2563eb",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            {area.guName} 전체 업체 →
          </Link>
        </div>
      </header>

      {/* 지역 소개 */}

      <section
        style={{
          padding: "56px 20px",
          background:
            "linear-gradient(135deg, #eff6ff, #ffffff)",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          <p
            style={{
              color: "#2563eb",
              fontWeight: 700,
            }}
          >
            서울 {area.guName}{" "}
            {area.dongName}
          </p>

          <h1
            style={{
              fontSize:
                "clamp(28px, 5vw, 42px)",
              lineHeight: 1.35,
            }}
          >
            {area.dongName} 쿡탑
            설치·교체
            <br />
            업체 찾기
          </h1>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.8,
              maxWidth: "760px",
            }}
          >
            서울 {area.guName}{" "}
            {area.dongName}에서 쿡탑
            설치·교체 작업을 하는
            등록 업체를 찾아보세요.
            업체 정보를 확인한 뒤
            상세 페이지 또는 업체
            홈페이지로 이동할 수
            있습니다.
          </p>
        </div>
      </section>

      {/* 업체 목록 */}

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "48px 20px",
        }}
      >
        <h2
          style={{
            fontSize: "25px",
          }}
        >
          {area.dongName} 쿡탑교체
          등록 업체
        </h2>

        <p
          style={{
            color: "#64748b",
            marginBottom: "28px",
          }}
        >
          현재 조건에 맞는 등록 업체{" "}
          <strong>
            {companies.length}곳
          </strong>
        </p>

        {companies.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              padding: "36px 24px",
              borderRadius: "16px",
              border:
                "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <h3>
              현재 표시할 업체가
              없습니다.
            </h3>

            <p
              style={{
                color: "#64748b",
                lineHeight: 1.8,
              }}
            >
              {area.dongName}에서
              작업하는 업체가 등록되면
              이곳에서 확인할 수
              있습니다.
            </p>

            <Link
              href={districtUrl}
              style={{
                display: "inline-block",
                marginTop: "16px",
                padding: "12px 20px",
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: "10px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {area.guName} 전체
              업체 보기
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 290px), 1fr))",
              gap: "20px",
            }}
          >
            {companies.map(
              (company) => {
                const image =
                  Array.isArray(
                    company.images
                  )
                    ? company.images.find(
                        (item) =>
                          typeof item ===
                            "string" &&
                          item.trim()
                      )
                    : null;

                const website =
                  getWebsiteUrl(
                    company.website_url
                  );

                return (
                  <article
                    key={company.id}
                    style={{
                      overflow:
                        "hidden",
                      background:
                        "#ffffff",
                      border:
                        "1px solid #e5e7eb",
                      borderRadius:
                        "16px",
                    }}
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={`${company.name ?? "등록 업체"} 대표사진`}
                        loading="lazy"
                        style={{
                          display:
                            "block",
                          width: "100%",
                          height:
                            "190px",
                          objectFit:
                            "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          height:
                            "190px",
                          display:
                            "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          background:
                            "#eff6ff",
                          fontSize:
                            "48px",
                        }}
                      >
                        🏠
                      </div>
                    )}

                    <div
                      style={{
                        padding:
                          "22px",
                      }}
                    >
                      <h3
                        style={{
                          fontSize:
                            "21px",
                          marginTop:
                            0,
                        }}
                      >
                        {company.name ||
                          "등록 업체"}
                      </h3>

                      <p
                        style={{
                          color:
                            "#475569",
                          lineHeight:
                            1.7,
                        }}
                      >
                        {company.description ||
                          "업체 상세 페이지에서 시공 정보를 확인하세요."}
                      </p>

                      <p
                        style={{
                          color:
                            "#64748b",
                          fontSize:
                            "14px",
                          lineHeight:
                            1.7,
                        }}
                      >
                        📍{" "}
                        {company.regions?.join(
                          ", "
                        ) ||
                          "서비스 지역 문의"}
                      </p>

                      <p
                        style={{
                          color:
                            "#64748b",
                          fontSize:
                            "14px",
                          lineHeight:
                            1.7,
                        }}
                      >
                        🛠️{" "}
                        {company.services?.join(
                          ", "
                        ) ||
                          "시공 분야 문의"}
                      </p>

                      <Link
                        href={`/companies/${encodeURIComponent(
                          company.id
                        )}`}
                        style={{
                          display:
                            "block",
                          marginTop:
                            "18px",
                          padding:
                            "12px 16px",
                          background:
                            "#2563eb",
                          color:
                            "#ffffff",
                          borderRadius:
                            "10px",
                          textAlign:
                            "center",
                          fontWeight:
                            700,
                          textDecoration:
                            "none",
                        }}
                      >
                        업체 상세보기
                      </Link>

                      {website && (
                        <a
                          href={website}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display:
                              "block",
                            marginTop:
                              "10px",
                            padding:
                              "12px 16px",
                            border:
                              "1px solid #2563eb",
                            color:
                              "#2563eb",
                            borderRadius:
                              "10px",
                            textAlign:
                              "center",
                            fontWeight:
                              700,
                            textDecoration:
                              "none",
                          }}
                        >
                          🌐 업체 홈페이지 방문
                        </a>
                      )}
                    </div>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      {/* 다른 지역 이동 */}

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding:
            "0 20px 60px",
        }}
      >
        <h2>
          다른 지역 쿡탑교체
          업체 찾기
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <Link
            href="/seoul/cooktop"
            style={{
              padding:
                "10px 14px",
              borderRadius:
                "10px",
              background:
                "#2563eb",
              color:
                "#ffffff",
              textDecoration:
                "none",
              fontWeight:
                700,
            }}
          >
            서울 전체
          </Link>

          {DISTRICTS.map(
            (district) => (
              <Link
                key={
                  district.slug
                }
                href={`/seoul/${district.slug}/cooktop`}
                style={{
                  padding:
                    "10px 14px",
                  borderRadius:
                    "10px",
                  background:
                    "#ffffff",
                  border:
                    "1px solid #dbeafe",
                  color:
                    "#2563eb",
                  textDecoration:
                    "none",
                  fontWeight:
                    700,
                }}
              >
                {
                  district.name
                }
              </Link>
            )
          )}
        </div>

        <p
          style={{
            marginTop: "24px",
            color: "#64748b",
            lineHeight: 1.8,
          }}
        >
          쿡탑 설치 가능 여부와
          작업 비용은 제품 종류,
          기존 타공 크기 및 현장
          조건에 따라 달라질 수
          있습니다. 작업 전 업체에
          직접 확인해 주세요.
        </p>
      </section>
    </main>
  );
}


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
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?.trim() ?? "";

/* =====================================
   영등포구 동별 페이지

   대표 동 이름과 행정동을 함께 지원
===================================== */

const DONGS = [
  { slug: "yeongdeungpo-dong", name: "영등포동" },
  { slug: "yeongdeungpo-bon-dong", name: "영등포본동" },
  { slug: "yeouido-dong", name: "여의도동" },
  { slug: "yeoui-dong", name: "여의동" },
  { slug: "dangsan-dong", name: "당산동" },
  { slug: "dangsan-1-dong", name: "당산1동" },
  { slug: "dangsan-2-dong", name: "당산2동" },
  { slug: "dorim-dong", name: "도림동" },
  { slug: "mullae-dong", name: "문래동" },
  { slug: "yangpyeong-dong", name: "양평동" },
  { slug: "yangpyeong-1-dong", name: "양평1동" },
  { slug: "yangpyeong-2-dong", name: "양평2동" },
  { slug: "singil-dong", name: "신길동" },
  { slug: "singil-1-dong", name: "신길1동" },
  { slug: "singil-3-dong", name: "신길3동" },
  { slug: "singil-4-dong", name: "신길4동" },
  { slug: "singil-5-dong", name: "신길5동" },
  { slug: "singil-6-dong", name: "신길6동" },
  { slug: "singil-7-dong", name: "신길7동" },
  { slug: "daerim-dong", name: "대림동" },
  { slug: "daerim-1-dong", name: "대림1동" },
  { slug: "daerim-2-dong", name: "대림2동" },
  { slug: "daerim-3-dong", name: "대림3동" },
] as const;

type Dong = (typeof DONGS)[number];

type PageProps = {
  params: Promise<{
    gu: string;
    dong: string;
  }>;
};

/* =====================================
   업체 데이터 타입
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

/* =====================================
   동 이름 찾기
===================================== */

function getDong(slug: string): Dong | undefined {
  return DONGS.find((item) => item.slug === slug);
}

function normalize(value: string): string {
  return value
    .replace(/\s+/g, "")
    .toLowerCase();
}

/* =====================================
   업체 서비스 지역 확인

   서울 전 지역 업체:
   영등포구 모든 동에 표시

   영등포구 전 지역 업체:
   영등포구 모든 동에 표시

   특정 동 업체:
   해당 동에만 표시
===================================== */

function servesDong(
  regions: string[] | null,
  dongName: string
): boolean {
  if (!Array.isArray(regions)) {
    return false;
  }

  const allSeoulValues = new Set([
    "서울",
    "서울시",
    "서울특별시",
    "서울전지역",
    "서울전체",
    "서울전역",
    "서울시전지역",
    "서울시전체",
    "서울특별시전지역",
    "서울특별시전체",
    "수도권",
    "수도권전지역",
    "수도권전체",
  ]);

  const allYeongdeungpoValues = new Set([
    "영등포구",
    "영등포구전지역",
    "영등포구전체",
    "영등포구전역",
    "서울영등포구",
    "서울영등포구전지역",
    "서울영등포구전체",
    "서울특별시영등포구",
    "서울특별시영등포구전지역",
    "서울특별시영등포구전체",
  ]);

  return regions.some((region) => {
    const value = normalize(region);

    if (allSeoulValues.has(value)) {
      return true;
    }

    if (allYeongdeungpoValues.has(value)) {
      return true;
    }

    // 등록 지역에 해당 동이 직접 적힌 경우
    if (value.includes(normalize(dongName))) {
      return true;
    }

    // 여의동과 여의도동은 같은 지역으로 연결
    if (
      (dongName === "여의동" ||
        dongName === "여의도동") &&
      (value.includes("여의동") ||
        value.includes("여의도동"))
    ) {
      return true;
    }

    // 당산동 등록 업체를 당산1·2동에도 표시
    if (
      dongName.startsWith("당산") &&
      value.includes("당산동")
    ) {
      return true;
    }

    // 양평동 등록 업체를 양평1·2동에도 표시
    if (
      dongName.startsWith("양평") &&
      value.includes("양평동")
    ) {
      return true;
    }

    // 신길동 등록 업체를 신길 행정동에도 표시
    if (
      dongName.startsWith("신길") &&
      value.includes("신길동")
    ) {
      return true;
    }

    // 대림동 등록 업체를 대림1·2·3동에도 표시
    if (
      dongName.startsWith("대림") &&
      value.includes("대림동")
    ) {
      return true;
    }

    // 영등포동 등록 업체를 영등포본동에도 표시
    if (
      dongName === "영등포본동" &&
      value.includes("영등포동")
    ) {
      return true;
    }

    return false;
  });
}

/* =====================================
   쿡탑 설치·교체 분야 확인
===================================== */

function installsCooktops(
  services: string[] | null
): boolean {
  if (!Array.isArray(services)) {
    return false;
  }

  return services.some((service) => {
    const value = normalize(service);

    return (
      value.includes("쿡탑") ||
      value.includes("인덕션") ||
      value.includes("가스레인지") ||
      value.includes("가스렌지")
    );
  });
}

/* =====================================
   업체 홈페이지 주소 확인
===================================== */

function getWebsiteUrl(
  value: string | null
): string | null {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (
      !["https:", "http:"].includes(url.protocol) ||
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
   승인된 업체 조회

   업체가 늘어나도 계속 불러오도록
   500개씩 나누어 조회
===================================== */

async function getCompanies(
  dongName: string
): Promise<Company[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다."
    );
  }

  const matched: Company[] = [];

  const pageSize = 500;
  let offset = 0;

  while (true) {
    const query = new URLSearchParams({
      select:
        "id,name,description,regions,services,images,website_url",
      limit: String(pageSize),
      offset: String(offset),
      order: "id.asc",
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
        `업체 조회 실패 (${response.status})`
      );
    }

    const rows: Company[] = await response.json();

    if (!Array.isArray(rows)) {
      throw new Error(
        "업체 데이터 형식이 올바르지 않습니다."
      );
    }

    matched.push(
      ...rows.filter(
        (company) =>
          servesDong(company.regions, dongName) &&
          installsCooktops(company.services)
      )
    );

    if (rows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return matched;
}

/* =====================================
   동별 주소 생성
===================================== */

export function generateStaticParams() {
  return DONGS.map((item) => ({
    gu: "yeongdeungpo-gu",
    dong: item.slug,
  }));
}

/* =====================================
   검색엔진 메타데이터

   등록 업체가 없는 동 페이지는
   검색 색인 대상에서 제외
===================================== */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { gu, dong } = await params;

  const area =
    gu === "yeongdeungpo-gu"
      ? getDong(dong)
      : undefined;

  if (!area) {
    return {
      title: "지역을 찾을 수 없습니다 | 집수리모아",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const companies = await getCompanies(area.name);

  const title =
    `서울 영등포구 ${area.name} 쿡탑 설치·교체 업체 찾기 | 집수리모아`;

  const description =
    `서울 영등포구 ${area.name}에서 쿡탑 설치·교체 작업을 하는 등록 업체를 확인하세요. 업체별 시공 분야와 서비스 지역을 비교하고 업체 홈페이지를 방문할 수 있습니다.`;

  const pageUrl =
    `${SITE_URL}/seoul/yeongdeungpo-gu/${area.slug}/cooktop`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots:
      companies.length > 0
        ? {
            index: true,
            follow: true,
          }
        : {
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
   영등포구 동별 쿡탑교체 페이지
===================================== */

export default async function DongCooktopPage({
  params,
}: PageProps) {
  const { gu, dong } = await params;

  if (gu !== "yeongdeungpo-gu") {
    notFound();
  }

  const area = getDong(dong);

  if (!area) {
    notFound();
  }

  const companies = await getCompanies(area.name);

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
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            padding: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: "22px",
              fontWeight: 800,
              color: "#172033",
              textDecoration: "none",
            }}
          >
            🏠 집수리모아
          </Link>

          <Link
            href="/seoul/yeongdeungpo-gu/cooktop"
            style={{
              color: "#2563eb",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            영등포구 전체 업체 →
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
            서울 영등포구 {area.name}
          </p>

          <h1
            style={{
              fontSize: "clamp(28px, 5vw, 42px)",
              lineHeight: 1.35,
            }}
          >
            {area.name} 쿡탑 설치·교체
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
            서울 영등포구 {area.name}에서
            쿡탑 설치·교체 작업을 하는 등록
            업체를 찾아보세요. 업체 정보를
            확인한 뒤 상세 페이지 또는
            업체 홈페이지로 이동할 수
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
        <h2 style={{ fontSize: "25px" }}>
          {area.name} 쿡탑교체 등록 업체
        </h2>

        <p
          style={{
            color: "#64748b",
            marginBottom: "28px",
          }}
        >
          현재 조건에 맞는 등록 업체{" "}
          <strong>{companies.length}곳</strong>
        </p>

        {companies.length === 0 ? (
          <div
            style={{
              background: "#ffffff",
              padding: "36px 24px",
              borderRadius: "16px",
              border: "1px solid #e5e7eb",
              textAlign: "center",
            }}
          >
            <h3>
              현재 표시할 업체가 없습니다.
            </h3>

            <p
              style={{
                color: "#64748b",
                lineHeight: 1.8,
              }}
            >
              {area.name}에서 작업하는 업체가
              등록되면 이곳에서 확인할 수
              있습니다.
            </p>

            <Link
              href="/seoul/yeongdeungpo-gu/cooktop"
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
              영등포구 전체 업체 보기
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
            {companies.map((company) => {
              const image =
                Array.isArray(company.images)
                  ? company.images.find(
                      (item) =>
                        typeof item === "string" &&
                        item.trim().length > 0
                    )
                  : null;

              const website = getWebsiteUrl(
                company.website_url
              );

              return (
                <article
                  key={company.id}
                  style={{
                    overflow: "hidden",
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "16px",
                  }}
                >
                  {image ? (
                    <img
                      src={image}
                      alt={`${company.name ?? "등록 업체"} 대표사진`}
                      loading="lazy"
                      style={{
                        display: "block",
                        width: "100%",
                        height: "190px",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: "190px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        background: "#eff6ff",
                        fontSize: "48px",
                      }}
                    >
                      🏠
                    </div>
                  )}

                  <div style={{ padding: "22px" }}>
                    <h3
                      style={{
                        fontSize: "21px",
                        marginTop: 0,
                      }}
                    >
                      {company.name || "등록 업체"}
                    </h3>

                    <p
                      style={{
                        color: "#475569",
                        lineHeight: 1.7,
                      }}
                    >
                      {company.description ||
                        "업체 상세 페이지에서 시공 정보를 확인하세요."}
                    </p>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        lineHeight: 1.7,
                      }}
                    >
                      📍{" "}
                      {company.regions?.join(", ") ||
                        "서비스 지역 문의"}
                    </p>

                    <p
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        lineHeight: 1.7,
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
                        marginTop: "18px",
                        padding: "12px 16px",
                        background: "#2563eb",
                        color: "#ffffff",
                        borderRadius: "10px",
                        textAlign: "center",
                        fontWeight: 700,
                        textDecoration: "none",
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
                          display: "block",
                          marginTop: "10px",
                          padding: "12px 16px",
                          border: "1px solid #2563eb",
                          color: "#2563eb",
                          borderRadius: "10px",
                          textAlign: "center",
                          fontWeight: 700,
                          textDecoration: "none",
                        }}
                      >
                        🌐 업체 홈페이지 방문
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* 영등포구 다른 동 찾아보기 */}

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 20px 60px",
        }}
      >
        <h2>영등포구 다른 동 찾아보기</h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {DONGS.map((item) => (
            <Link
              key={item.slug}
              href={`/seoul/yeongdeungpo-gu/${item.slug}/cooktop`}
              style={{
                display: "inline-block",
                padding: "10px 14px",
                background:
                  item.slug === area.slug
                    ? "#2563eb"
                    : "#ffffff",
                color:
                  item.slug === area.slug
                    ? "#ffffff"
                    : "#2563eb",
                border: "1px solid #dbeafe",
                borderRadius: "10px",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {item.name}
            </Link>
          ))}
        </div>

        <p
          style={{
            marginTop: "24px",
            color: "#64748b",
            lineHeight: 1.8,
          }}
        >
          쿡탑 설치 가능 여부와 작업 비용은
          제품 종류, 기존 타공 크기 및 현장
          조건에 따라 달라질 수 있습니다.
          작업 전 업체에 직접 확인해 주세요.
        </p>
      </section>
    </main>
  );
}

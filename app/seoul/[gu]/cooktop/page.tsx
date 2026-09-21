
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
   서울 25개 자치구
===================================== */

const SEOUL_DISTRICTS = [
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

type District =
  (typeof SEOUL_DISTRICTS)[number];

type PageProps = {
  params: Promise<{ gu: string }>;
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
   지역 확인
===================================== */

function normalize(value: string) {
  return value
    .replace(/\s+/g, "")
    .toLowerCase();
}

function servesDistrict(
  regions: string[] | null,
  districtName: string
) {
  if (!Array.isArray(regions)) {
    return false;
  }

  return regions.some((region) => {
    const value = normalize(region);

    // 서울 전체 또는 수도권 전체 작업 업체
    const coversAllSeoul =
      value === "서울" ||
      value === "서울시" ||
      value === "서울특별시" ||
      value === "서울전지역" ||
      value === "서울전체" ||
      value === "서울시전지역" ||
      value === "서울특별시전지역" ||
      value === "서울전역" ||
      value === "서울시전체" ||
      value === "수도권" ||
      value === "수도권전지역" ||
      value === "수도권전체";

    if (coversAllSeoul) {
      return true;
    }

    // 서울 영등포구 등 특정 구 등록
    if (value.includes(districtName)) {
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
) {
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
   외부 홈페이지 주소 확인
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
   승인된 업체 조회
===================================== */

async function getCompanies(
  districtName: string
): Promise<Company[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다."
    );
  }

  const matchedCompanies: Company[] = [];

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
        `업체 목록 조회 실패 (${response.status})`
      );
    }

    const rows: Company[] =
      await response.json();

    if (!Array.isArray(rows)) {
      throw new Error(
        "업체 목록 데이터 형식이 올바르지 않습니다."
      );
    }

    matchedCompanies.push(
      ...rows.filter(
        (company) =>
          servesDistrict(
            company.regions,
            districtName
          ) &&
          installsCooktops(
            company.services
          )
      )
    );

    if (rows.length < pageSize) {
      break;
    }

    offset += pageSize;
  }

  return matchedCompanies;
}

/* =====================================
   구 이름 확인
===================================== */

function getDistrict(
  slug: string
): District | undefined {
  return SEOUL_DISTRICTS.find(
    (district) =>
      district.slug === slug
  );
}

/* =====================================
   검색엔진 메타데이터
===================================== */

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { gu } = await params;

  const district = getDistrict(gu);

  if (!district) {
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
    `서울 ${district.name} 쿡탑 설치·교체 업체 찾기 | 집수리모아`;

  const description =
    `서울 ${district.name}에서 쿡탑 설치·교체 작업을 하는 등록 업체를 찾아보세요. 업체별 서비스 지역과 시공 분야를 확인하고 업체 상세 페이지 또는 홈페이지로 이동할 수 있습니다.`;

  const pageUrl =
    `${SITE_URL}/seoul/${district.slug}/cooktop`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
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
   구별 페이지 주소 생성
===================================== */

export function generateStaticParams() {
  return SEOUL_DISTRICTS.map(
    (district) => ({
      gu: district.slug,
    })
  );
}

/* =====================================
   서울 구별 쿡탑교체 업체 페이지
===================================== */

export default async function DistrictCooktopPage({
  params,
}: PageProps) {
  const { gu } = await params;

  const district = getDistrict(gu);

  if (!district) {
    notFound();
  }

  const companies =
    await getCompanies(district.name);

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
            justifyContent:
              "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
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
            href="/seoul/cooktop"
            style={{
              color: "#2563eb",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            서울 전체 쿡탑교체 →
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
            서울 {district.name} 업체 찾기
          </p>

          <h1
            style={{
              fontSize:
                "clamp(28px, 5vw, 42px)",
              lineHeight: 1.35,
            }}
          >
            {district.name} 쿡탑
            설치·교체 업체 찾기
          </h1>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.8,
              maxWidth: "760px",
            }}
          >
            서울 {district.name}에서
            쿡탑 설치·교체 작업을 하는
            등록 업체를 확인해 보세요.
            업체별 시공 분야와 서비스
            지역을 비교하고 상세 페이지
            또는 업체 홈페이지로
            이동할 수 있습니다.
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
          {district.name} 쿡탑교체
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
              border:
                "1px solid #e5e7eb",
              borderRadius: "16px",
              padding: "36px 24px",
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
              {district.name}에서
              쿡탑교체 작업을 하는
              업체가 등록되면 이곳에
              표시됩니다.
            </p>

            <Link
              href="/seoul/cooktop"
              style={{
                display: "inline-block",
                marginTop: "16px",
                padding: "12px 20px",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              서울 전체 업체 보기
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
                    overflow: "hidden",
                    background: "#ffffff",
                    border:
                      "1px solid #e5e7eb",
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
                        justifyContent:
                          "center",
                        alignItems: "center",
                        background: "#eff6ff",
                        fontSize: "48px",
                      }}
                    >
                      🏠
                    </div>
                  )}

                  <div
                    style={{
                      padding: "22px",
                    }}
                  >
                    <h3
                      style={{
                        fontSize: "21px",
                        marginTop: 0,
                      }}
                    >
                      {company.name ||
                        "등록 업체"}
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
                        borderRadius: "10px",
                        background: "#2563eb",
                        color: "#ffffff",
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
                          borderRadius: "10px",
                          border:
                            "1px solid #2563eb",
                          color: "#2563eb",
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

      {/* 서울 다른 구 찾아보기 */}

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding: "0 20px 60px",
        }}
      >
        <h2>
          서울 다른 지역 쿡탑교체
          업체 찾기
        </h2>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          {SEOUL_DISTRICTS.map((item) => (
            <Link
              key={item.slug}
              href={`/seoul/${item.slug}/cooktop`}
              style={{
                display: "inline-block",
                padding: "10px 14px",
                background:
                  item.slug === district.slug
                    ? "#2563eb"
                    : "#ffffff",
                color:
                  item.slug === district.slug
                    ? "#ffffff"
                    : "#2563eb",
                border:
                  "1px solid #dbeafe",
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
          쿡탑 설치 가능 여부와 작업
          비용은 제품 종류, 기존 타공
          크기, 전기·가스 연결 상태 등
          현장 조건에 따라 달라질 수
          있습니다. 작업 전 업체에
          직접 확인해 주세요.
        </p>
      </section>
    </main>
  );
}


import type { Metadata } from "next";
import Link from "next/link";

/* =====================================
   기본 정보
===================================== */

const SITE_URL =
  "https://www.jipsurimoa.com";

const PAGE_URL =
  `${SITE_URL}/seoul/cooktop`;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?.trim() ?? "";

/* =====================================
   검색엔진 정보
===================================== */

export const metadata: Metadata = {
  title:
    "서울 쿡탑 설치·교체 업체 찾기 | 집수리모아",

  description:
    "서울에서 쿡탑 설치·교체 작업을 하는 등록 업체를 찾아보세요. 업체별 시공 분야와 서비스 지역을 확인하고 업체 상세 페이지 또는 홈페이지로 이동할 수 있습니다.",

  alternates: {
    canonical: PAGE_URL,
  },

  openGraph: {
    title:
      "서울 쿡탑 설치·교체 업체 찾기 | 집수리모아",
    description:
      "서울 쿡탑 설치·교체 등록 업체와 홈페이지를 확인하세요.",
    url: PAGE_URL,
    type: "website",
  },
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
   지역 및 시공 분야 확인
===================================== */

function normalize(value: string) {
  return value
    .replace(/\s+/g, "")
    .toLowerCase();
}

function servesSeoul(
  regions: string[] | null
) {
  if (!Array.isArray(regions)) {
    return false;
  }

  return regions.some((region) => {
    const value = normalize(region);

    return (
      value.includes("서울") ||
      value.includes("수도권")
    );
  });
}

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
   안전한 홈페이지 주소
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
===================================== */

async function getCompanies(): Promise<
  Company[]
> {
  if (
    !SUPABASE_URL ||
    !SUPABASE_KEY
  ) {
    console.error(
      "Supabase 환경변수가 없습니다."
    );

    return [];
  }

  const query = new URLSearchParams({
    select:
      "id,name,description,regions,services,images,website_url",
    limit: "1000",
  });

  try {
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
      console.error(
        "업체 목록 조회 실패:",
        response.status
      );

      return [];
    }

    const companies: Company[] =
      await response.json();

    if (!Array.isArray(companies)) {
      return [];
    }

    return companies.filter(
      (company) =>
        servesSeoul(company.regions) &&
        installsCooktops(
          company.services
        )
    );
  } catch (error) {
    console.error(
      "업체 목록 조회 오류:",
      error
    );

    return [];
  }
}

/* =====================================
   서울 쿡탑 설치·교체 페이지
===================================== */

export default async function SeoulCooktopPage() {
  const companies =
    await getCompanies();

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
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/"
            style={{
              color: "#172033",
              fontWeight: 800,
              fontSize: "22px",
              textDecoration: "none",
            }}
          >
            🏠 집수리모아
          </Link>

          <Link
            href="/companies"
            style={{
              color: "#2563eb",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            전체 업체 찾기 →
          </Link>
        </div>
      </header>

      {/* 대표 소개 */}

      <section
        style={{
          background:
            "linear-gradient(135deg, #eff6ff, #ffffff)",
          padding: "60px 20px",
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
              marginBottom: "12px",
            }}
          >
            서울 지역 업체 찾기
          </p>

          <h1
            style={{
              fontSize:
                "clamp(28px, 5vw, 42px)",
              lineHeight: 1.35,
              marginBottom: "18px",
            }}
          >
            서울 쿡탑 설치·교체
            <br />
            업체 찾기
          </h1>

          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.8,
              color: "#475569",
              maxWidth: "760px",
            }}
          >
            서울에서 쿡탑 설치·교체
            작업을 하는 등록 업체를
            찾아보세요. 업체별 서비스
            지역과 시공 분야를 확인한
            뒤 상세 페이지 또는 업체
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
            marginBottom: "10px",
          }}
        >
          서울 쿡탑 설치·교체
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
              padding: "40px 24px",
              borderRadius: "16px",
              border:
                "1px solid #e5e7eb",
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
              서울에서 쿡탑 설치·교체
              작업을 하는 업체가 등록되면
              이곳에서 확인할 수 있습니다.
            </p>

            <Link
              href="/companies"
              style={{
                display: "inline-block",
                marginTop: "16px",
                padding:
                  "12px 20px",
                borderRadius: "10px",
                background: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              다른 업체 찾아보기
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
                        alignItems: "center",
                        justifyContent:
                          "center",
                        background:
                          "#eff6ff",
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
                        marginBottom:
                          "10px",
                      }}
                    >
                      {company.name ||
                        "등록 업체"}
                    </h3>

                    <p
                      style={{
                        color: "#475569",
                        lineHeight: 1.7,
                        minHeight: "54px",
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
                      {company.regions?.join(
                        ", "
                      ) ||
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
                        display: "block",
                        marginTop:
                          "18px",
                        padding:
                          "12px 16px",
                        borderRadius:
                          "10px",
                        background:
                          "#2563eb",
                        color: "#ffffff",
                        fontWeight: 700,
                        textAlign:
                          "center",
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
                          borderRadius:
                            "10px",
                          border:
                            "1px solid #2563eb",
                          color:
                            "#2563eb",
                          fontWeight:
                            700,
                          textAlign:
                            "center",
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
            })}
          </div>
        )}
      </section>

      {/* 하단 안내 */}

      <section
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          padding:
            "0 20px 60px",
        }}
      >
        <div
          style={{
            padding: "24px",
            background: "#ffffff",
            border:
              "1px solid #e5e7eb",
            borderRadius: "16px",
          }}
        >
          <h2>
            서울 쿡탑 설치·교체
            업체를 찾고 계신가요?
          </h2>

          <p
            style={{
              color: "#475569",
              lineHeight: 1.8,
            }}
          >
            쿡탑 설치 가능 여부와
            작업 비용은 제품 종류,
            기존 타공 크기, 전기·가스
            연결 상태 및 현장 조건에
            따라 달라질 수 있습니다.
            작업을 의뢰하기 전에
            업체에 직접 문의해 주세요.
          </p>

          <Link
            href="/companies"
            style={{
              color: "#2563eb",
              fontWeight: 700,
            }}
          >
            집수리모아 전체 업체 보기 →
          </Link>
        </div>
      </section>
    </main>
  );
}

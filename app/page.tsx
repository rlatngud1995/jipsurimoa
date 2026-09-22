
import Link from "next/link";
import HomeClient from "./HomeClient";

/* =====================================
   집수리모아 메인 홈페이지

   HomeClient.tsx:
   기존 홈페이지 디자인 및 기능 유지

   page.tsx:
   서버에서 승인 업체 정보를 불러와
   검색로봇이 읽을 수 있는 HTML로 출력
===================================== */

const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
)
  .replace(/\/rest\/v1\/?$/, "")
  .replace(/\/$/, "");

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

type Company = {
  id: string | number;
  name: string | null;
  description: string | null;
  regions: string[] | null;
  services: string[] | null;
};

/* =====================================
   서버에서 승인 업체 불러오기
===================================== */

async function getCompanies(): Promise<Company[] | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error(
      "집수리모아: Supabase 환경변수가 없습니다."
    );

    return null;
  }

  const companies: Company[] = [];
  const pageSize = 500;

  try {
    for (let offset = 0; ; offset += pageSize) {
      const query = new URLSearchParams({
        select:
          "id,name,description,regions,services",
        order: "id.asc",
        limit: String(pageSize),
        offset: String(offset),
      });

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/approved_companies?${query.toString()}`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          next: {
            revalidate: 300,
          },
        }
      );

      if (!response.ok) {
        console.error(
          "집수리모아: 서버 업체 조회 실패",
          response.status
        );

        return null;
      }

      const rows: unknown = await response.json();

      if (!Array.isArray(rows)) {
        console.error(
          "집수리모아: 업체 응답 형식 오류"
        );

        return null;
      }

      const pageRows = rows as Company[];

      companies.push(...pageRows);

      if (pageRows.length < pageSize) {
        break;
      }
    }

    return companies;
  } catch (error) {
    console.error(
      "집수리모아: 서버 업체 조회 오류",
      error
    );

    return null;
  }
}

/* =====================================
   서버에서 업체 정보 출력
===================================== */

async function ServerCompanyPreview() {
  const companies = await getCompanies();

  if (!companies || companies.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="server-company-heading"
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: "30px 16px 60px",
      }}
    >
      <div style={{ marginBottom: 22 }}>
        <h2
          id="server-company-heading"
          style={{
            fontSize: 25,
            lineHeight: 1.4,
            marginBottom: 10,
          }}
        >
          집수리모아 등록 업체 안내
        </h2>

        <p
          style={{
            color: "#64748b",
            lineHeight: 1.7,
          }}
        >
          집수리모아에 등록된 업체의 시공 분야와
          서비스 지역을 확인해 보세요.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
          gap: 16,
        }}
      >
        {companies.map((company) => (
          <article
            key={String(company.id)}
            style={{
              padding: 20,
              border: "1px solid #e2e8f0",
              borderRadius: 16,
              background: "#ffffff",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 10,
                fontSize: 19,
                color: "#0f172a",
              }}
            >
              {company.name || "등록 업체"}
            </h3>

            <p
              style={{
                color: "#475569",
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
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.7,
              }}
            >
              <strong>시공 분야</strong>
              <br />
              {(company.services ?? []).join(" · ") ||
                "미등록"}
            </p>

            <p
              style={{
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.7,
              }}
            >
              <strong>서비스 지역</strong>
              <br />
              {(company.regions ?? []).join(" · ") ||
                "미등록"}
            </p>

            <Link
              href={`/companies/${encodeURIComponent(
                String(company.id)
              )}`}
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "10px 14px",
                borderRadius: 9,
                background: "#2563eb",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              업체 상세보기 →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/* =====================================
   메인 홈페이지
===================================== */

export default function HomePage() {
  return (
    <>
      <HomeClient />
      <ServerCompanyPreview />
    </>
  );
}

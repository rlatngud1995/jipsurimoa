
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import Footer from "../../Footer";
import CompanyPromotion from "./CompanyPromotion";

/* =====================================
   기본 설정
===================================== */

const SITE_URL =
  "https://www.jipsurimoa.com";

const EASY_HOMECARE_URL =
  "https://easyhomecare.vercel.app/";

const EASY_HOMECARE_IMAGE =
  "/IMG_0778.png";

/* =====================================
   Supabase 연결
===================================== */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.trim()
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ?.trim() ?? "";

/* =====================================
   업체 데이터 타입
===================================== */

type CompanyRow = {
  id: string;
  name: string | null;
  description: string | null;
  phone: string | null;
  regions: string[] | null;
  services: string[] | null;
  images: string[] | null;
  website_url: string | null;
};

type Company = {
  id: string;
  name: string;
  description: string;
  phone: string;
  regions: string[];
  services: string[];
  images: string[];
  website_url: string | null;
};

/* =====================================
   업체 데이터 정리
===================================== */

function toCompany(
  row: CompanyRow
): Company {
  return {
    id: row.id,
    name: row.name ?? "",
    description:
      row.description ?? "",
    phone: row.phone ?? "",
    regions:
      Array.isArray(row.regions)
        ? row.regions
        : [],
    services:
      Array.isArray(row.services)
        ? row.services
        : [],
    images:
      Array.isArray(row.images)
        ? row.images.filter(
            (image): image is string =>
              typeof image === "string" &&
              image.trim().length > 0
          )
        : [],
    website_url:
      row.website_url ?? null,
  };
}

/* =====================================
   이지종합건설 기존 설정 유지
===================================== */

function isEasyHomecare(
  company: Company
): boolean {
  return (
    company.name
      .replace(/\s+/g, "")
      .trim() ===
    "이지종합건설"
  );
}

function getCompanyImages(
  company: Company
): string[] {
  if (isEasyHomecare(company)) {
    return [
      EASY_HOMECARE_IMAGE,
      ...company.images.filter(
        (image) =>
          image !== EASY_HOMECARE_IMAGE
      ),
    ];
  }

  return company.images;
}

/* =====================================
   외부 홈페이지 주소 검사
===================================== */

function getSafeWebsiteUrl(
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

function getCompanyWebsite(
  company: Company
): string | null {
  const registeredWebsite =
    getSafeWebsiteUrl(
      company.website_url
    );

  if (registeredWebsite) {
    return registeredWebsite;
  }

  if (isEasyHomecare(company)) {
    return EASY_HOMECARE_URL;
  }

  return null;
}

/* =====================================
   승인된 업체 1곳 조회
===================================== */

async function getCompany(
  id: string
): Promise<Company | null> {
  if (
    !SUPABASE_URL ||
    !SUPABASE_KEY
  ) {
    throw new Error(
      "Supabase 환경변수가 설정되지 않았습니다."
    );
  }

  const query =
    new URLSearchParams({
      select:
        "id,name,description,phone,regions,services,images,website_url",
      id: `eq.${id}`,
      limit: "1",
    });

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/approved_companies?${query.toString()}`,
    {
      method: "GET",
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
      `업체 정보를 불러오지 못했습니다. (${response.status})`
    );
  }

  const rows: CompanyRow[] =
    await response.json();

  if (
    !Array.isArray(rows) ||
    rows.length === 0
  ) {
    return null;
  }

  return toCompany(rows[0]);
}

/* =====================================
   업체별 검색엔진 메타데이터
===================================== */

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}): Promise<Metadata> {
  const { id } = await params;

  const company =
    await getCompany(id);

  if (!company) {
    return {
      title:
        "업체를 찾을 수 없습니다 | 집수리모아",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    company.description.trim() ||
    `${company.name}의 시공 분야와 서비스 지역, 시공사진 및 문의 정보를 집수리모아에서 확인하세요.`;

  const pageUrl =
    `${SITE_URL}/companies/${encodeURIComponent(
      company.id
    )}`;

  const images =
    getCompanyImages(company);

  return {
    title:
      `${company.name} | 집수리모아 업체 소개`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title:
        `${company.name} | 집수리모아`,
      description,
      url: pageUrl,
      type: "website",
      ...(images.length > 0
        ? {
            images: [
              {
                url: new URL(
                  images[0],
                  SITE_URL
                ).toString(),
                alt:
                  `${company.name} 대표사진`,
              },
            ],
          }
        : {}),
    },
  };
}

/* =====================================
   업체별 상세 홍보 페이지
===================================== */

export default async function CompanyDetail({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } = await params;

  const company =
    await getCompany(id);

  if (!company) {
    notFound();
  }

  const website =
    getCompanyWebsite(company);

  const images =
    getCompanyImages(company);

  const phoneHref =
    company.phone.replace(
      /[^\d+]/g,
      ""
    );

  const pageUrl =
    `${SITE_URL}/companies/${encodeURIComponent(
      company.id
    )}`;

  return (
    <main>
      {/* =====================================
         상단 메뉴
      ===================================== */}

      <header className="header">
        <Link
          href="/"
          className="logo"
        >
          🏠 집수리모아
        </Link>

        <nav>
          <Link href="/">
            홈
          </Link>

          <Link href="/companies">
            업체 찾기
          </Link>
        </nav>
      </header>

      {/* =====================================
         업체 대표 소개
      ===================================== */}

      <section className="pageHero">
        <div className="container">
          <span className="heroBadge">
            집수리모아 등록 업체
          </span>

          <h1>
            {company.name}
          </h1>

          <p>
            {company.description ||
              "업체의 시공 분야와 서비스 지역을 확인해 보세요."}
          </p>

          <CompanyPromotion
            companyId={company.id}
            companyName={company.name}
            pageUrl={pageUrl}
            phone={company.phone}
            phoneHref={phoneHref}
            website={website}
            images={images}
            variant="hero"
          />
        </div>
      </section>

      {/* =====================================
         업체 대표사진
      ===================================== */}

      {images.length > 0 && (
        <section
          className="section container"
          style={{
            paddingBottom: 0,
          }}
        >
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              overflow: "hidden",
              borderRadius: "18px",
              border:
                "1px solid #e5e7eb",
              background: "#f8fafc",
            }}
          >
            <a
              href={images[0]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${company.name} 대표사진 크게 보기`}
            >
              <img
                src={images[0]}
                alt={`${company.name} 대표사진`}
                style={{
                  display: "block",
                  width: "100%",
                  maxHeight: "420px",
                  objectFit: "contain",
                }}
              />
            </a>
          </div>
        </section>
      )}

      {/* =====================================
         업체 기본 정보
      ===================================== */}

      <section className="section container">
        <div className="detailCard">
          <h2>
            업체 소개
          </h2>

          <p
            style={{
              whiteSpace: "pre-line",
            }}
          >
            {company.description ||
              "업체 소개글이 아직 등록되지 않았습니다."}
          </p>

          <h3>
            서비스 지역
          </h3>

          <p>
            {company.regions.length > 0
              ? company.regions.join(", ")
              : "업체에 문의해 주세요."}
          </p>

          <h3>
            전문 시공 분야
          </h3>

          <p>
            {company.services.length > 0
              ? company.services.join(", ")
              : "업체에 문의해 주세요."}
          </p>

          {/* 고객 문의 및 홍보 버튼 */}

          <CompanyPromotion
            companyId={company.id}
            companyName={company.name}
            pageUrl={pageUrl}
            phone={company.phone}
            phoneHref={phoneHref}
            website={website}
            images={images}
            variant="actions"
          />

          {/* 업체 홍보 주소 */}

          <div
            style={{
              marginTop: "28px",
              padding: "16px",
              borderRadius: "12px",
              background: "#f8fafc",
              border:
                "1px solid #e5e7eb",
            }}
          >
            <h3
              style={{
                marginTop: 0,
              }}
            >
              🔗 업체 홍보 페이지 주소
            </h3>

            <p
              style={{
                overflowWrap: "anywhere",
                fontSize: "14px",
              }}
            >
              {pageUrl}
            </p>

            <p
              className="formHint"
              style={{
                marginBottom: 0,
              }}
            >
              이 주소를 복사해 블로그,
              SNS, 고객 안내 메시지에
              공유해 보세요.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================
         시공사진
      ===================================== */}

      <section className="section container">
        <div className="sectionTitle">
          <h2>
            시공사례 및 업체 사진
          </h2>

          <p>
            사진을 누르면 크게 볼 수 있습니다.
          </p>
        </div>

        {images.length > 0 ? (
          <CompanyPromotion
            companyId={company.id}
            companyName={company.name}
            pageUrl={pageUrl}
            phone={company.phone}
            phoneHref={phoneHref}
            website={website}
            images={images}
            variant="gallery"
          />
        ) : (
          <div className="emptyBox">
            아직 등록된 사진이 없습니다.
          </div>
        )}
      </section>

      {/* =====================================
         목록으로 돌아가기
      ===================================== */}

      <section className="section container">
        <Link
          href="/companies"
          className="outlineButton"
        >
          ← 다른 업체 찾아보기
        </Link>
      </section>

      <Footer />
    </main>
  );
}

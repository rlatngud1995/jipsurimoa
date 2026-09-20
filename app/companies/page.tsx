
"use client";

import Link from "next/link";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { regions, services } from "../data";

import type { Company } from "../data";

import Footer from "../Footer";

/* =====================================
   이지종합건설 기존 설정
===================================== */

const EASY_HOMECARE_URL =
  "https://easyhomecare.vercel.app/";

const EASY_HOMECARE_IMAGE =
  "/IMG_0778.png";

/* =====================================
   Supabase 연결
===================================== */

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/* =====================================
   업체 데이터 타입

   기존 Company 타입은 유지하면서
   홈페이지 주소만 추가합니다.
===================================== */

type CompanyWithWebsite = Company & {
  website_url: string | null;
};

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

function toCompany(
  row: CompanyRow
): CompanyWithWebsite {
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    phone: row.phone ?? "",
    regions: Array.isArray(row.regions)
      ? row.regions
      : [],
    services: Array.isArray(row.services)
      ? row.services
      : [],
    images: Array.isArray(row.images)
      ? row.images
      : [],
    website_url: row.website_url ?? null,
  };
}

/* =====================================
   이지종합건설 확인
===================================== */

function isEasyHomecare(
  company: CompanyWithWebsite
): boolean {
  return (
    company.name.replace(/\s+/g, "").trim() ===
    "이지종합건설"
  );
}

/* =====================================
   홈페이지 주소 안전하게 확인

   http 또는 https 주소만 연결합니다.
===================================== */

function getSafeWebsiteUrl(
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
   업체별 홈페이지 자동 연결

   1. 업체가 등록한 홈페이지 주소 우선
   2. 이지종합건설 기존 주소 유지
   3. 주소가 없으면 내부 상세페이지 사용
===================================== */

function getCompanyWebsite(
  company: CompanyWithWebsite
): string | null {
  const registeredWebsite =
    getSafeWebsiteUrl(company.website_url);

  if (registeredWebsite) {
    return registeredWebsite;
  }

  if (isEasyHomecare(company)) {
    return EASY_HOMECARE_URL;
  }

  return null;
}

/* =====================================
   업체별 대표 이미지
===================================== */

function getCompanyImage(
  company: CompanyWithWebsite
): string | null {
  if (isEasyHomecare(company)) {
    return EASY_HOMECARE_IMAGE;
  }

  if (company.images.length > 0) {
    return company.images[0];
  }

  return null;
}

/* =====================================
   업체 찾기 페이지
===================================== */

export default function CompaniesPage() {
  const [companies, setCompanies] =
    useState<CompanyWithWebsite[]>([]);

  const [region, setRegion] = useState("");
  const [service, setService] = useState("");
  const [keyword, setKeyword] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =====================================
     승인 업체 불러오기
  ===================================== */

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError("");

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setError(
        "업체 검색 설정을 확인할 수 없습니다."
      );
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/approved_companies?select=id,name,description,phone,regions,services,images,website_url`,
        {
          method: "GET",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
          },
          cache: "no-store",
        }
      );

      if (!response.ok) {
        throw new Error(
          `업체 목록을 불러오지 못했습니다. (${response.status})`
        );
      }

      const rows: unknown =
        await response.json();

      if (!Array.isArray(rows)) {
        throw new Error(
          "업체 목록의 응답 형식이 올바르지 않습니다."
        );
      }

      setCompanies(
        (rows as CompanyRow[]).map(toCompany)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "업체 목록을 불러오는 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  /* =====================================
     업체 검색
  ===================================== */

  const results = useMemo(() => {
    const normalizedKeyword =
      keyword.trim().toLowerCase();

    return companies.filter((company) => {
      const matchRegion =
        !region ||
        company.regions.includes(region);

      const matchService =
        !service ||
        company.services.includes(service);

      const searchableText = [
        company.name,
        company.description,
        ...company.regions,
        ...company.services,
      ]
        .join(" ")
        .toLowerCase();

      const matchKeyword =
        !normalizedKeyword ||
        searchableText.includes(
          normalizedKeyword
        );

      return (
        matchRegion &&
        matchService &&
        matchKeyword
      );
    });
  }, [companies, region, service, keyword]);

  /* =====================================
     화면
  ===================================== */

  return (
    <main>
      {/* 상단 메뉴 */}

      <header className="header">
        <Link href="/" className="logo">
          🏠 집수리모아
        </Link>

        <nav>
          <Link href="/">
            홈
          </Link>

          <Link href="/register">
            업체 등록
          </Link>
        </nav>
      </header>

      {/* 상단 소개 */}

      <section className="pageHero">
        <div className="container">
          <h1>
            집수리 업체 찾기
          </h1>

          <p>
            지역과 시공 종류를 선택해
            원하는 업체를 검색하세요.
          </p>
        </div>
      </section>

      {/* 검색 필터 */}

      <section className="section container">
        <div className="filterBox">
          <select
            value={region}
            onChange={(event) =>
              setRegion(event.target.value)
            }
            aria-label="지역 선택"
          >
            <option value="">
              전체 지역
            </option>

            {regions.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <select
            value={service}
            onChange={(event) =>
              setService(event.target.value)
            }
            aria-label="시공 종류 선택"
          >
            <option value="">
              전체 시공
            </option>

            {services.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}
          </select>

          <input
            type="search"
            placeholder="업체명 또는 시공 키워드"
            value={keyword}
            onChange={(event) =>
              setKeyword(event.target.value)
            }
            aria-label="업체명 검색"
          />
        </div>

        {/* 검색 결과 */}

        <h2>
          {loading
            ? "업체 목록을 불러오는 중..."
            : error
            ? "업체 검색 오류"
            : `검색 결과 ${results.length}곳`}
        </h2>

        {/* 오류 안내 */}

        {error && (
          <div
            className="emptyBox"
            role="alert"
            style={{
              color: "#b91c1c",
            }}
          >
            <p>{error}</p>

            <button
              type="button"
              className="outlineButton"
              onClick={() => {
                void loadCompanies();
              }}
            >
              다시 불러오기
            </button>
          </div>
        )}

        {/* 업체 목록 */}

        {!loading && !error && (
          <>
            <div className="companyGrid">
              {results.map((company) => {
                const website =
                  getCompanyWebsite(company);

                const companyImage =
                  getCompanyImage(company);

                return (
                  <article
                    className="companyCard"
                    key={company.id}
                  >
                    {/* 업체 대표사진 */}

                    <div
                      className="companyImage"
                      style={
                        isEasyHomecare(company)
                          ? {
                              background: "#ffffff",
                            }
                          : undefined
                      }
                    >
                      {companyImage ? (
                        <img
                          src={companyImage}
                          alt={`${company.name} 대표 이미지`}
                          loading="lazy"
                          style={
                            isEasyHomecare(company)
                              ? {
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                  background: "#ffffff",
                                }
                              : undefined
                          }
                        />
                      ) : (
                        <span aria-hidden="true">
                          🏠
                        </span>
                      )}
                    </div>

                    {/* 업체 정보 */}

                    <div className="companyContent">
                      <span className="companyBadge">
                        등록 업체
                      </span>

                      <h3>
                        {company.name}
                      </h3>

                      <p>
                        {company.description}
                      </p>

                      <div className="companyInfo">
                        <span>
                          📍{" "}
                          {company.regions.join(", ")}
                        </span>

                        <span>
                          🔧{" "}
                          {company.services.join(", ")}
                        </span>
                      </div>

                      {/* 상세보기 및 전화 문의 */}

                      <div className="companyActions">
                        {website ? (
                          <a
                            href={website}
                            className="primaryButton"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            업체 상세보기
                          </a>
                        ) : (
                          <Link
                            href={`/companies/${company.id}`}
                            className="primaryButton"
                          >
                            업체 상세보기
                          </Link>
                        )}

                        {company.phone && (
                          <a
                            href={`tel:${company.phone}`}
                            className="outlineButton"
                          >
                            📞 전화 문의
                          </a>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* 검색 결과 없음 */}

            {results.length === 0 && (
              <div className="emptyBox">
                {companies.length === 0
                  ? "현재 공개된 업체가 없습니다."
                  : "검색 조건에 맞는 등록 업체가 없습니다."}
              </div>
            )}
          </>
        )}

        {/* 로딩 화면 */}

        {loading && (
          <div className="emptyBox">
            업체 목록을 불러오는 중입니다...
          </div>
        )}
      </section>

      {/* 공통 하단 사업자 정보 */}

      <Footer />
    </main>
  );
}

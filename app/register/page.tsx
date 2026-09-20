
"use client";

import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";
import { regions, services } from "../data";
import Footer from "../Footer";

type ApplicationData = {
  name: string;
  owner: string;
  phone: string;
  website_url: string | null;
  description: string;
  regions: string[];
  services: string[];
  images: string[];
  status: string;
};

type SupabaseError = {
  message?: string;
  code?: string;
  details?: string | null;
  hint?: string | null;
};

/* =====================================
   홈페이지 주소 확인
===================================== */

function normalizeWebsiteUrl(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const withProtocol = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(withProtocol);

    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      !parsed.hostname.includes(".") ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

/* =====================================
   업체 등록 페이지
===================================== */

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [owner, setOwner] = useState("");
  const [phone, setPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [description, setDescription] = useState("");

  const [selectedRegions, setSelectedRegions] =
    useState<string[]>([]);

  const [selectedServices, setSelectedServices] =
    useState<string[]>([]);

  const [preview, setPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const normalizedWebsiteUrl =
    normalizeWebsiteUrl(websiteUrl);

  function toggle(
    value: string,
    selected: string[],
    setter: (items: string[]) => void
  ) {
    setter(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value]
    );
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =====================================
     신청 내용 확인
  ===================================== */

  function handlePreview(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !name.trim() ||
      !owner.trim() ||
      !phone.trim() ||
      !description.trim()
    ) {
      setErrorMessage("필수 정보를 모두 입력해 주세요.");
      return;
    }

    if (
      selectedRegions.length === 0 ||
      selectedServices.length === 0
    ) {
      setErrorMessage(
        "서비스 지역과 시공 분야를 선택해 주세요."
      );
      return;
    }

    if (websiteUrl.trim() && !normalizedWebsiteUrl) {
      setErrorMessage(
        "홈페이지 주소를 확인해 주세요. 예: https://example.com"
      );
      return;
    }

    setErrorMessage("");
    setPreview(true);
    scrollToTop();
  }

  /* =====================================
     Supabase에 신청서 저장
  ===================================== */

  async function handleFinalSubmit() {
    if (submitting || submitted) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const supabaseUrl =
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();

      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          "Supabase 연결 정보가 없습니다. Vercel의 NEXT_PUBLIC_SUPABASE_URL 및 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해 주세요."
        );
      }

      const application: ApplicationData = {
        name: name.trim(),
        owner: owner.trim(),
        phone: phone.trim(),
        website_url: normalizedWebsiteUrl,
        description: description.trim(),
        regions: selectedRegions,
        services: selectedServices,
        images: [],
        status: "pending",
      };

      const apiUrl =
        `${supabaseUrl.replace(/\/+$/, "")}` +
        "/rest/v1/company_applications";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(application),
      });

      if (!response.ok) {
        const responseText = await response.text();

        let errorDetails = responseText;

        try {
          const parsedError = JSON.parse(
            responseText
          ) as SupabaseError;

          errorDetails = [
            parsedError.message,
            parsedError.code
              ? `코드: ${parsedError.code}`
              : "",
            parsedError.details
              ? `상세: ${parsedError.details}`
              : "",
            parsedError.hint
              ? `힌트: ${parsedError.hint}`
              : "",
          ]
            .filter(Boolean)
            .join("\n");
        } catch {
          // JSON이 아닌 오류 응답은 원문을 표시합니다.
        }

        console.error("업체 등록 신청 실패:", {
          status: response.status,
          details: errorDetails,
        });

        throw new Error(
          `신청 저장에 실패했습니다.\n` +
            `HTTP 오류 코드: ${response.status}\n` +
            `${
              errorDetails ||
              "서버에서 오류 내용을 반환하지 않았습니다."
            }`
        );
      }

      setSubmitted(true);
      setPreview(false);
      scrollToTop();
    } catch (error) {
      console.error("업체 등록 신청 오류:", error);

      if (error instanceof TypeError) {
        setErrorMessage(
          "서버 연결에 실패했습니다.\n" +
            "Supabase URL, 인터넷 연결 또는 API 접근 설정을 확인해 주세요.\n" +
            `상세 오류: ${error.message}`
        );
      } else {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다. 다시 시도해 주세요."
        );
      }

      scrollToTop();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      {/* 상단 메뉴 */}

      <header className="header">
        <Link href="/" className="logo">
          🏠 집수리모아
        </Link>

        <Link href="/companies">
          업체 찾기
        </Link>
      </header>

      {/* 상단 소개 */}

      <section className="pageHero">
        <div className="container">
          <h1>집수리 업체 등록</h1>

          <p>
            집수리모아에 업체를 소개하고
            고객에게 시공 서비스를 알려보세요.
          </p>
        </div>
      </section>

      <section className="section container">
        <div className="registerCard">
          {submitted ? (
            /* =====================================
               신청 완료
            ===================================== */

            <div className="formGroup">
              <h2>등록 신청이 접수되었습니다! 🎉</h2>

              <p>
                업체 등록 신청이 정상적으로 저장되었습니다.
                신청 내용을 확인한 뒤 등록 여부를
                안내해 드리겠습니다.
              </p>

              <p>
                <strong>업체명:</strong> {name}
              </p>

              <p>
                <strong>연락처:</strong> {phone}
              </p>

              {normalizedWebsiteUrl && (
                <p>
                  <strong>홈페이지:</strong>{" "}
                  <a
                    href={normalizedWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#2563eb",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {normalizedWebsiteUrl}
                  </a>
                </p>
              )}

              <p className="formHint">
                신청서를 제출했다고 해서 업체 목록에
                즉시 공개되는 것은 아닙니다.
              </p>

              <Link href="/" className="primaryButton">
                홈페이지로 돌아가기
              </Link>
            </div>
          ) : preview ? (
            /* =====================================
               신청 내용 미리보기
            ===================================== */

            <div className="formGroup">
              <h2>등록 신청 내용 확인</h2>

              <p>
                아래 내용을 확인한 후 등록 신청을
                제출해 주세요.
              </p>

              <p>
                <strong>업체명:</strong> {name}
              </p>

              <p>
                <strong>대표자:</strong> {owner}
              </p>

              <p>
                <strong>연락처:</strong> {phone}
              </p>

              <p>
                <strong>홈페이지:</strong>{" "}
                {normalizedWebsiteUrl ? (
                  <a
                    href={normalizedWebsiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      color: "#2563eb",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {normalizedWebsiteUrl}
                  </a>
                ) : (
                  "등록하지 않음"
                )}
              </p>

              <p>
                <strong>지역:</strong>{" "}
                {selectedRegions.join(", ")}
              </p>

              <p>
                <strong>시공 분야:</strong>{" "}
                {selectedServices.join(", ")}
              </p>

              <p>
                <strong>소개:</strong> {description}
              </p>

              <p className="formHint">
                시공사례 사진은 현재 신청 단계에서
                업로드되지 않습니다.
              </p>

              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    color: "#991b1b",
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "14px",
                    borderRadius: "10px",
                    marginBottom: "16px",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    fontSize: "14px",
                    lineHeight: 1.6,
                  }}
                >
                  <strong>등록 신청 오류</strong>
                  <br />
                  {errorMessage}
                </div>
              )}

              <button
                type="button"
                className="primaryButton fullButton"
                onClick={handleFinalSubmit}
                disabled={submitting}
              >
                {submitting
                  ? "신청서 제출 중..."
                  : "등록 신청 제출하기"}
              </button>

              <button
                type="button"
                className="outlineButton"
                onClick={() => {
                  setErrorMessage("");
                  setPreview(false);
                }}
                disabled={submitting}
                style={{ marginTop: "12px" }}
              >
                입력 내용 수정하기
              </button>
            </div>
          ) : (
            /* =====================================
               업체 등록 신청서
            ===================================== */

            <form onSubmit={handlePreview}>
              <h2>업체 기본정보</h2>

              <div className="formGroup">
                <label htmlFor="companyName">
                  업체명 *
                </label>

                <input
                  id="companyName"
                  required
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                  placeholder="업체명을 입력하세요"
                />
              </div>

              <div className="formGroup">
                <label htmlFor="ownerName">
                  대표자명 *
                </label>

                <input
                  id="ownerName"
                  required
                  value={owner}
                  onChange={(e) =>
                    setOwner(e.target.value)
                  }
                  placeholder="대표자명"
                />
              </div>

              <div className="formGroup">
                <label htmlFor="companyPhone">
                  연락처 *
                </label>

                <input
                  id="companyPhone"
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value)
                  }
                  placeholder="010-0000-0000"
                />
              </div>

              {/* 홈페이지 주소 입력 */}

              <div className="formGroup">
                <label htmlFor="companyWebsite">
                  업체 홈페이지 주소 (선택)
                </label>

                <input
                  id="companyWebsite"
                  type="text"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={websiteUrl}
                  onChange={(e) =>
                    setWebsiteUrl(e.target.value)
                  }
                  placeholder="https://example.com"
                />

                <p className="formHint">
                  홈페이지가 있다면 주소를 입력해 주세요.
                  승인 후 고객이 상세보기 버튼을 눌렀을 때
                  해당 홈페이지로 이동하도록 연결할 예정입니다.
                  홈페이지가 없다면 비워두셔도 됩니다.
                </p>
              </div>

              <div className="formGroup">
                <label>서비스 지역 *</label>

                <div className="checkGrid">
                  {regions.map((region) => (
                    <label key={region}>
                      <input
                        type="checkbox"
                        checked={selectedRegions.includes(
                          region
                        )}
                        onChange={() =>
                          toggle(
                            region,
                            selectedRegions,
                            setSelectedRegions
                          )
                        }
                      />

                      {region}
                    </label>
                  ))}
                </div>
              </div>

              <div className="formGroup">
                <label>전문 시공 분야 *</label>

                <div className="checkGrid">
                  {services.map((service) => (
                    <label key={service}>
                      <input
                        type="checkbox"
                        checked={selectedServices.includes(
                          service
                        )}
                        onChange={() =>
                          toggle(
                            service,
                            selectedServices,
                            setSelectedServices
                          )
                        }
                      />

                      {service}
                    </label>
                  ))}
                </div>
              </div>

              <div className="formGroup">
                <label htmlFor="description">
                  업체 소개 *
                </label>

                <textarea
                  id="description"
                  required
                  rows={5}
                  value={description}
                  onChange={(e) =>
                    setDescription(e.target.value)
                  }
                  placeholder="업체의 전문 분야와 시공 서비스를 소개해 주세요."
                />
              </div>

              <div className="formGroup">
                <label>시공사례 사진</label>

                <p className="formHint">
                  사진 업로드 기능은 준비 중입니다.
                  현재는 업체 기본정보만 등록 신청할 수
                  있습니다.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  style={{
                    color: "#991b1b",
                    background: "#fef2f2",
                    padding: "12px",
                    borderRadius: "8px",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                    marginBottom: "16px",
                  }}
                >
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                className="primaryButton fullButton"
              >
                등록 신청 내용 확인하기
              </button>
            </form>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}


"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";

type Application = {
  id: string;
  name: string | null;
  owner: string | null;
  phone: string | null;
  website_url: string | null;
  description: string | null;
  regions: string[] | null;
  services: string[] | null;
  images: string[] | null;
  status: string | null;
  created_at: string | null;
};

type ApplicationStatus = "approved" | "rejected";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL
    ?.replace(/\/rest\/v1\/?$/, "")
    .replace(/\/$/, "") ?? "";

const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

function getHeaders(accessToken: string) {
  return {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function readError(
  response: Response
): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (
      typeof data?.error_description === "string"
    ) {
      return data.error_description;
    }

    if (typeof data?.error === "string") {
      return data.error;
    }
  } catch {
    // 오류 응답이 JSON이 아닌 경우
  }

  return `서버 오류 (${response.status})`;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("ko-KR");
}

function statusLabel(status: string | null) {
  if (status === "approved") return "승인 완료";
  if (status === "rejected") return "반려";
  return "승인 대기";
}

/* =====================================
   홈페이지 주소 확인
===================================== */

function getSafeWebsiteUrl(
  value: string | null
): string | null {
  if (!value?.trim()) return null;

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
   관리자 페이지
===================================== */

export default function AdminPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [accessToken, setAccessToken] =
    useState("");

  const [isAdmin, setIsAdmin] =
    useState(false);

  const [applications, setApplications] =
    useState<Application[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [processingId, setProcessingId] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  /* =====================================
     신청 목록 불러오기
  ===================================== */

  const loadApplications = useCallback(
    async (token: string) => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/company_applications?select=*&order=created_at.desc`,
          {
            method: "GET",
            headers: getHeaders(token),
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `신청 목록을 불러오지 못했습니다. ${await readError(
              response
            )}`
          );
        }

        const data: unknown =
          await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "신청 목록의 응답 형식이 올바르지 않습니다."
          );
        }

        setApplications(
          data as Application[]
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "신청 목록을 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      setError(
        "Supabase 환경변수가 없습니다. Vercel 설정을 확인해 주세요."
      );
    }
  }, []);

  /* =====================================
     관리자 로그인
  ===================================== */

  async function handleLogin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!SUPABASE_URL || !SUPABASE_KEY) {
        throw new Error(
          "Supabase 환경변수를 확인해 주세요."
        );
      }

      const loginResponse = await fetch(
        `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
        {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        }
      );

      if (!loginResponse.ok) {
        throw new Error(
          "로그인에 실패했습니다. 이메일과 비밀번호를 확인해 주세요."
        );
      }

      const loginData =
        await loginResponse.json();

      const token = loginData.access_token as
        | string
        | undefined;

      if (!token) {
        throw new Error(
          "로그인 토큰을 받지 못했습니다."
        );
      }

      const adminResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/rpc/is_admin`,
        {
          method: "POST",
          headers: getHeaders(token),
          body: JSON.stringify({}),
        }
      );

      if (!adminResponse.ok) {
        throw new Error(
          `관리자 권한 확인에 실패했습니다. ${await readError(
            adminResponse
          )}`
        );
      }

      const adminResult =
        await adminResponse.json();

      if (adminResult !== true) {
        throw new Error(
          "이 계정에는 관리자 권한이 없습니다."
        );
      }

      setAccessToken(token);
      setIsAdmin(true);
      setPassword("");

      setMessage(
        "관리자 로그인이 완료되었습니다."
      );

      await loadApplications(token);
    } catch (err) {
      setAccessToken("");
      setIsAdmin(false);

      setError(
        err instanceof Error
          ? err.message
          : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================
     로그아웃
  ===================================== */

  function handleLogout() {
    setAccessToken("");
    setIsAdmin(false);
    setApplications([]);
    setPassword("");
    setProcessingId("");
    setError("");
    setMessage("로그아웃되었습니다.");
  }

  /* =====================================
     업체 승인 및 반려
  ===================================== */

  async function changeStatus(
    application: Application,
    nextStatus: ApplicationStatus
  ) {
    if (!accessToken || !isAdmin) {
      setError(
        "관리자 로그인 후 다시 시도해 주세요."
      );
      return;
    }

    if (processingId) return;

    if (application.status === nextStatus) {
      setError(
        nextStatus === "approved"
          ? "이미 승인된 업체입니다."
          : "이미 반려된 신청입니다."
      );
      return;
    }

    if (
      nextStatus === "approved" &&
      (!application.name?.trim() ||
        !application.phone?.trim())
    ) {
      setError(
        "업체명 또는 연락처가 없어 승인할 수 없습니다."
      );
      return;
    }

    const action =
      nextStatus === "approved"
        ? "승인"
        : "반려";

    const confirmed = window.confirm(
      `${application.name || "해당 업체"}의 등록 신청을 ${action}하시겠습니까?`
    );

    if (!confirmed) return;

    setProcessingId(application.id);
    setError("");
    setMessage("");

    try {
      /*
       * approved_companies는 VIEW입니다.
       * 신청서의 status만 변경하면
       * 승인 업체 목록에 반영됩니다.
       */
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/company_applications?id=eq.${encodeURIComponent(
          application.id
        )}&status=eq.${encodeURIComponent(
          application.status ?? "pending"
        )}&select=id,status`,
        {
          method: "PATCH",
          headers: {
            ...getHeaders(accessToken),
            Prefer: "return=representation",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `${action} 처리에 실패했습니다. ${await readError(
            response
          )}`
        );
      }

      const updated: unknown =
        await response.json();

      if (
        !Array.isArray(updated) ||
        updated.length !== 1 ||
        updated[0]?.status !== nextStatus
      ) {
        throw new Error(
          "신청 상태가 변경되지 않았습니다. 새로고침 후 현재 상태를 확인해 주세요."
        );
      }

      setApplications((previous) =>
        previous.map((item) =>
          item.id === application.id
            ? {
                ...item,
                status: nextStatus,
              }
            : item
        )
      );

      setMessage(
        nextStatus === "approved"
          ? `${application.name} 업체를 승인했습니다. 공개 업체 목록에서 조회할 수 있습니다.`
          : `${application.name || "해당 업체"}의 등록 신청을 반려했습니다.`
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "신청 상태 변경 중 오류가 발생했습니다."
      );
    } finally {
      setProcessingId("");
    }
  }

  /* =====================================
     화면
  ===================================== */

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "#ffffff",
          borderBottom:
            "1px solid #e5eaf2",
          padding: "18px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "12px",
        }}
      >
        <Link
          href="/"
          style={{
            color: "#2563eb",
            fontWeight: 800,
            textDecoration: "none",
          }}
        >
          🏠 집수리모아
        </Link>

        <Link
          href="/"
          style={{
            color: "#475569",
            textDecoration: "none",
            fontSize: "14px",
          }}
        >
          홈페이지로 이동
        </Link>
      </header>

      <div
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          padding: "32px 16px 70px",
        }}
      >
        <div
          style={{
            marginBottom: "28px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "7px 12px",
              borderRadius: "20px",
              background: "#dbeafe",
              color: "#1d4ed8",
              fontSize: "13px",
              fontWeight: 700,
              marginBottom: "12px",
            }}
          >
            관리자 전용
          </span>

          <h1
            style={{
              fontSize: "28px",
              fontWeight: 800,
              margin: "0 0 10px",
            }}
          >
            업체 등록 관리
          </h1>

          <p
            style={{
              color: "#64748b",
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            업체 등록 신청을 확인하고
            승인 또는 반려할 수 있습니다.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              padding: "16px",
              background: "#fef2f2",
              border:
                "1px solid #fecaca",
              color: "#991b1b",
              borderRadius: "12px",
              marginBottom: "20px",
              lineHeight: 1.6,
              overflowWrap: "anywhere",
            }}
          >
            {error}
          </div>
        )}

        {message && (
          <div
            role="status"
            style={{
              padding: "16px",
              background: "#eff6ff",
              border:
                "1px solid #bfdbfe",
              color: "#1d4ed8",
              borderRadius: "12px",
              marginBottom: "20px",
              lineHeight: 1.6,
            }}
          >
            {message}
          </div>
        )}

        {!isAdmin ? (
          /* 관리자 로그인 */

          <form
            onSubmit={handleLogin}
            style={{
              background: "#ffffff",
              border:
                "1px solid #e5eaf2",
              borderRadius: "18px",
              padding: "24px",
              boxShadow:
                "0 8px 30px rgba(15,23,42,0.04)",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: "21px",
              }}
            >
              관리자 로그인
            </h2>

            <p
              style={{
                color: "#64748b",
                fontSize: "14px",
                lineHeight: 1.6,
              }}
            >
              Supabase에 등록한 관리자 계정으로
              로그인해 주세요.
            </p>

            <label
              htmlFor="admin-email"
              style={{
                display: "block",
                fontWeight: 700,
                marginTop: "20px",
                marginBottom: "8px",
              }}
            >
              이메일
            </label>

            <input
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="이메일 주소"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "10px",
                fontSize: "16px",
              }}
            />

            <label
              htmlFor="admin-password"
              style={{
                display: "block",
                fontWeight: 700,
                marginTop: "18px",
                marginBottom: "8px",
              }}
            >
              비밀번호
            </label>

            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="비밀번호"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "14px",
                border:
                  "1px solid #cbd5e1",
                borderRadius: "10px",
                fontSize: "16px",
              }}
            />

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                marginTop: "24px",
                padding: "15px",
                border: "none",
                borderRadius: "10px",
                background: loading
                  ? "#93c5fd"
                  : "#2563eb",
                color: "#ffffff",
                fontWeight: 800,
                fontSize: "16px",
                cursor: loading
                  ? "wait"
                  : "pointer",
              }}
            >
              {loading
                ? "확인 중..."
                : "관리자 로그인"}
            </button>
          </form>
        ) : (
          /* 업체 신청 목록 */

          <>
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: "21px",
                }}
              >
                등록 신청 목록 (
                {applications.length}건)
              </h2>

              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  type="button"
                  onClick={() =>
                    loadApplications(accessToken)
                  }
                  disabled={
                    loading ||
                    Boolean(processingId)
                  }
                  style={{
                    padding: "10px 14px",
                    border:
                      "1px solid #bfdbfe",
                    borderRadius: "9px",
                    background: "#ffffff",
                    color: "#1d4ed8",
                    fontWeight: 700,
                  }}
                >
                  새로고침
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={Boolean(processingId)}
                  style={{
                    padding: "10px 14px",
                    border:
                      "1px solid #cbd5e1",
                    borderRadius: "9px",
                    background: "#ffffff",
                    color: "#475569",
                    fontWeight: 700,
                  }}
                >
                  로그아웃
                </button>
              </div>
            </div>

            {loading ? (
              <div
                style={{
                  padding: "28px",
                  background: "#ffffff",
                  borderRadius: "14px",
                }}
              >
                신청 목록을 불러오는 중입니다...
              </div>
            ) : applications.length === 0 ? (
              <div
                style={{
                  padding: "28px",
                  background: "#ffffff",
                  borderRadius: "14px",
                  color: "#64748b",
                }}
              >
                현재 접수된 업체 등록 신청이
                없습니다.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gap: "16px",
                }}
              >
                {applications.map(
                  (application) => {
                    const isProcessing =
                      processingId ===
                      application.id;

                    const isBusy =
                      Boolean(processingId);

                    const isApproved =
                      application.status ===
                      "approved";

                    const isRejected =
                      application.status ===
                      "rejected";

                    const website =
                      getSafeWebsiteUrl(
                        application.website_url
                      );

                    return (
                      <article
                        key={application.id}
                        style={{
                          background: "#ffffff",
                          border:
                            "1px solid #e5eaf2",
                          borderRadius: "16px",
                          padding: "22px",
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: "12px",
                            flexWrap: "wrap",
                            marginBottom: "14px",
                          }}
                        >
                          <h3
                            style={{
                              margin: 0,
                              fontSize: "21px",
                            }}
                          >
                            {application.name ||
                              "업체명 미입력"}
                          </h3>

                          <span
                            style={{
                              background:
                                isApproved
                                  ? "#dcfce7"
                                  : isRejected
                                  ? "#fee2e2"
                                  : "#fef3c7",
                              color:
                                isApproved
                                  ? "#166534"
                                  : isRejected
                                  ? "#991b1b"
                                  : "#92400e",
                              borderRadius:
                                "20px",
                              padding:
                                "6px 12px",
                              fontSize:
                                "13px",
                              fontWeight: 700,
                            }}
                          >
                            {statusLabel(
                              application.status
                            )}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "grid",
                            gap: "10px",
                            lineHeight: 1.7,
                          }}
                        >
                          <div>
                            <strong>
                              대표자:{" "}
                            </strong>
                            {application.owner ||
                              "-"}
                          </div>

                          <div>
                            <strong>
                              연락처:{" "}
                            </strong>
                            {application.phone ||
                              "-"}
                          </div>

                          {/* 홈페이지 주소 */}

                          <div>
                            <strong>
                              홈페이지:{" "}
                            </strong>

                            {website ? (
                              <a
                                href={website}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "#2563eb",
                                  textDecoration:
                                    "underline",
                                  overflowWrap:
                                    "anywhere",
                                }}
                              >
                                {website}
                              </a>
                            ) : (
                              "등록하지 않음"
                            )}
                          </div>

                          <div>
                            <strong>
                              지역:{" "}
                            </strong>
                            {application.regions?.join(
                              ", "
                            ) || "-"}
                          </div>

                          <div>
                            <strong>
                              시공 분야:{" "}
                            </strong>
                            {application.services?.join(
                              ", "
                            ) || "-"}
                          </div>

                          <div>
                            <strong>
                              소개:{" "}
                            </strong>
                            {application.description ||
                              "-"}
                          </div>

                          <div>
                            <strong>
                              신청일:{" "}
                            </strong>
                            {formatDate(
                              application.created_at
                            )}
                          </div>
                        </div>

                        {application.images &&
                          application.images.length >
                            0 && (
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns:
                                  "repeat(auto-fill, minmax(130px, 1fr))",
                                gap: "10px",
                                marginTop: "18px",
                              }}
                            >
                              {application.images.map(
                                (image, index) => (
                                  <a
                                    key={`${application.id}-${index}`}
                                    href={image}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={image}
                                      alt={`${
                                        application.name ||
                                        "업체"
                                      } 시공 사진 ${
                                        index + 1
                                      }`}
                                      style={{
                                        display:
                                          "block",
                                        width: "100%",
                                        aspectRatio:
                                          "4 / 3",
                                        objectFit:
                                          "cover",
                                        borderRadius:
                                          "10px",
                                        background:
                                          "#f1f5f9",
                                      }}
                                    />
                                  </a>
                                )
                              )}
                            </div>
                          )}

                        <div
                          style={{
                            display: "flex",
                            flexWrap: "wrap",
                            gap: "10px",
                            marginTop: "22px",
                            paddingTop: "18px",
                            borderTop:
                              "1px solid #e5eaf2",
                          }}
                        >
                          {!isApproved && (
                            <button
                              type="button"
                              onClick={() =>
                                changeStatus(
                                  application,
                                  "approved"
                                )
                              }
                              disabled={isBusy}
                              style={{
                                flex:
                                  "1 1 130px",
                                padding: "13px",
                                border:
                                  "none",
                                borderRadius:
                                  "10px",
                                background:
                                  isBusy
                                    ? "#86efac"
                                    : "#16a34a",
                                color:
                                  "#ffffff",
                                fontWeight:
                                  800,
                                fontSize:
                                  "15px",
                                cursor:
                                  isBusy
                                    ? "wait"
                                    : "pointer",
                              }}
                            >
                              {isProcessing
                                ? "처리 중..."
                                : "✓ 업체 승인"}
                            </button>
                          )}

                          {!isApproved &&
                            !isRejected && (
                              <button
                                type="button"
                                onClick={() =>
                                  changeStatus(
                                    application,
                                    "rejected"
                                  )
                                }
                                disabled={isBusy}
                                style={{
                                  flex:
                                    "1 1 130px",
                                  padding:
                                    "13px",
                                  border:
                                    "1px solid #fecaca",
                                  borderRadius:
                                    "10px",
                                  background:
                                    "#fff1f2",
                                  color:
                                    "#be123c",
                                  fontWeight:
                                    800,
                                  fontSize:
                                    "15px",
                                  cursor:
                                    isBusy
                                      ? "wait"
                                      : "pointer",
                                }}
                              >
                                {isProcessing
                                  ? "처리 중..."
                                  : "✕ 신청 반려"}
                              </button>
                            )}

                          {isApproved && (
                            <span
                              style={{
                                color:
                                  "#166534",
                                fontWeight:
                                  700,
                                fontSize:
                                  "14px",
                                padding:
                                  "12px 0",
                              }}
                            >
                              승인된 업체
                            </span>
                          )}
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

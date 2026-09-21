
"use client";

import { useEffect, useState } from "react";

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
   컴포넌트 타입
===================================== */

type Props = {
  companyId: string;
  companyName: string;
  pageUrl: string;
  phone: string;
  phoneHref: string;
  website: string | null;
  images: string[];
  variant: "hero" | "actions" | "gallery";
};

/* =====================================
   업체 홍보 이벤트 기록
===================================== */

function recordPromotionEvent(
  companyId: string,
  eventType: "page_view" | "phone_click"
) {
  if (
    !SUPABASE_URL ||
    !SUPABASE_KEY ||
    !companyId
  ) {
    return;
  }

  const requestUrl =
    `${SUPABASE_URL}/rest/v1/rpc/` +
    "record_company_promotion_event";

  fetch(requestUrl, {
    method: "POST",
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_company_id: companyId,
      p_event_type: eventType,
    }),
    keepalive: true,
  }).catch((error) => {
    console.error(
      "업체 홍보 통계 기록 실패:",
      error
    );
  });
}

/* =====================================
   업체 홍보 기능
===================================== */

export default function CompanyPromotion({
  companyId,
  companyName,
  pageUrl,
  phone,
  phoneHref,
  website,
  images,
  variant,
}: Props) {
  const [copied, setCopied] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  /* =====================================
     업체 상세 페이지 조회 기록

     hero 컴포넌트에서만 실행하므로
     버튼과 갤러리 때문에 중복 기록하지 않음
  ===================================== */

  useEffect(() => {
    if (variant !== "hero") {
      return;
    }

    recordPromotionEvent(
      companyId,
      "page_view"
    );
  }, [companyId, variant]);

  /* =====================================
     확대 사진 닫기
  ===================================== */

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    function handleKeyDown(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [selectedImage]);

  /* =====================================
     전화 문의 클릭 기록
  ===================================== */

  function handlePhoneClick() {
    recordPromotionEvent(
      companyId,
      "phone_click"
    );
  }

  /* =====================================
     홍보 링크 복사
  ===================================== */

  async function copyPromotionLink() {
    try {
      await navigator.clipboard.writeText(
        pageUrl
      );

      setCopied(true);
    } catch {
      window.prompt(
        "아래 업체 홍보 링크를 복사해 주세요.",
        pageUrl
      );
    }
  }

  /* =====================================
     상단 홍보 버튼
  ===================================== */

  if (variant === "hero") {
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "22px",
        }}
      >
        {phoneHref && (
          <a
            href={`tel:${phoneHref}`}
            className="primaryButton"
            onClick={handlePhoneClick}
          >
            📞 전화 문의하기
          </a>
        )}

        <button
          type="button"
          className="outlineButton"
          onClick={copyPromotionLink}
          style={{
            cursor: "pointer",
          }}
        >
          {copied
            ? "✅ 홍보 링크 복사 완료"
            : "🔗 업체 홍보 링크 복사"}
        </button>
      </div>
    );
  }

  /* =====================================
     업체 소개 영역 버튼
  ===================================== */

  if (variant === "actions") {
    return (
      <div
        className="companyActions"
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px",
          marginTop: "24px",
        }}
      >
        {phoneHref && (
          <a
            href={`tel:${phoneHref}`}
            className="primaryButton"
            onClick={handlePhoneClick}
          >
            📞 {phone} 전화 문의
          </a>
        )}

        {website && (
          <a
            href={website}
            className="outlineButton"
            target="_blank"
            rel="noopener noreferrer"
          >
            🌐 업체 홈페이지 방문
          </a>
        )}

        <button
          type="button"
          className="outlineButton"
          onClick={copyPromotionLink}
          style={{
            cursor: "pointer",
          }}
        >
          {copied
            ? "✅ 홍보 링크 복사 완료"
            : "🔗 업체 홍보 링크 복사"}
        </button>
      </div>
    );
  }

  /* =====================================
     시공사진 갤러리
  ===================================== */

  return (
    <>
      <div className="photoGrid">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() =>
              setSelectedImage(image)
            }
            aria-label={`${companyName} 사진 ${
              index + 1
            } 크게 보기`}
            style={{
              display: "block",
              width: "100%",
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: "zoom-in",
              overflow: "hidden",
              borderRadius: "12px",
            }}
          >
            <img
              src={image}
              alt={`${companyName} 등록 사진 ${
                index + 1
              }`}
              loading="lazy"
              style={{
                display: "block",
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </button>
        ))}
      </div>

      {selectedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${companyName} 사진 확대`}
          onClick={() =>
            setSelectedImage(null)
          }
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            background:
              "rgba(0, 0, 0, 0.88)",
          }}
        >
          <button
            type="button"
            onClick={() =>
              setSelectedImage(null)
            }
            aria-label="사진 닫기"
            style={{
              position: "absolute",
              top: "16px",
              right: "16px",
              padding: "10px 14px",
              border: "1px solid #ffffff",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#111827",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: 700,
            }}
          >
            ✕ 닫기
          </button>

          <img
            src={selectedImage}
            alt={`${companyName} 확대 사진`}
            onClick={(event) =>
              event.stopPropagation()
            }
            style={{
              display: "block",
              maxWidth: "100%",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "8px",
            }}
          />
        </div>
      )}
    </>
  );
}

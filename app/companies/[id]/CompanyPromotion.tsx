
"use client";

import {
  useEffect,
  useState,
} from "react";

type Props = {
  companyName: string;
  pageUrl: string;
  variant: "button" | "gallery";
  images?: string[];
};

export default function CompanyPromotion({
  companyName,
  pageUrl,
  variant,
  images = [],
}: Props) {
  const [copied, setCopied] =
    useState(false);

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

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

  async function copyPromotionLink() {
    try {
      await navigator.clipboard.writeText(
        pageUrl
      );

      setCopied(true);
    } catch {
      window.prompt(
        "아래 홍보 링크를 복사해 주세요.",
        pageUrl
      );
    }
  }

  if (variant === "button") {
    return (
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
    );
  }

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

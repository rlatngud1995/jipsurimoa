
import Link from "next/link";

export default function Footer() {
  return (
    <footer
      className="footer"
      style={{
        background: "#f8fafc",
        borderTop: "1px solid #e2e8f0",
        padding: "36px 16px",
        color: "#334155",
      }}
    >
      <div
        className="container"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          lineHeight: 1.9,
        }}
      >
        <strong
          style={{
            fontSize: "20px",
            color: "#1e3a8a",
          }}
        >
          🏠 집수리모아
        </strong>

        <p
          style={{
            marginTop: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          전국 집수리 업체 검색 및 연결 플랫폼
        </p>

        <div
          style={{
            fontSize: "13px",
            lineHeight: 2,
          }}
        >
          <div>
            <strong>운영 사업자:</strong>{" "}
            수호인테리어
          </div>

          <div>
            <strong>대표자:</strong>{" "}
            김종진
          </div>

          <div>
            <strong>사업자등록번호:</strong>{" "}
            130-37-26952
          </div>

          <div>
            <strong>고객센터:</strong>{" "}
            <a href="tel:01094134686">
              010-9413-4686
            </a>
          </div>

          <div>
            <strong>이메일:</strong>{" "}
            <a href="mailto:rlatngud8557@naver.com">
              rlatngud8557@naver.com
            </a>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid #e2e8f0",
          }}
        >
          <Link
            href="/privacy"
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#1d4ed8",
              textDecoration: "underline",
            }}
          >
            개인정보처리방침
          </Link>
        </div>

        <p
          style={{
            marginTop: "16px",
            fontSize: "12px",
            color: "#64748b",
          }}
        >
          © 2026 집수리모아.
          All rights reserved.
        </p>
      </div>
    </footer>
  );
}

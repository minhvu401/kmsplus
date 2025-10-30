"use client";

import Link from "next/link";
import { Flex } from "antd";

export default function Footer() {
  return (
    <footer
      style={{
        borderTop: "1px solid #e5e7eb",
        marginTop: "3rem",
        paddingTop: "1.5rem",
        color: "#6b7280", // gray-500
        fontSize: "0.875rem",
      }}
    >
      <Flex
        align="center"
        justify="space-between"
        wrap="wrap"
        style={{
          rowGap: "0.75rem",
          textAlign: "center",
          marginLeft: "4rem",
          marginBottom: "1.5rem",
          marginRight: "4rem"
        }}
      >
        {/* Left text */}
        <p style={{ margin: 0 }}>
          © 2025 - <span style={{ fontWeight: 600 }}>KMSPlus</span>. Designed by{" "}
          <span style={{ fontWeight: 600 }}>KMS Team</span>. All rights reserved.
        </p>

        {/* Links */}
        <Flex gap="middle" justify="center" style={{ flexWrap: "wrap" }}>
          <Link
            href="/faqs"
            style={{
              transition: "color 0.2s",
            }}
            className="hover:text-blue-600"
          >
            FAQs
          </Link>
          <Link
            href="/privacy-policy"
            style={{
              transition: "color 0.2s",
            }}
            className="hover:text-blue-600"
          >
            Privacy Policy
          </Link>
          <Link
            href="/terms-and-condition"
            style={{
              transition: "color 0.2s",
            }}
            className="hover:text-blue-600"
          >
            Terms & Condition
          </Link>
        </Flex>
      </Flex>
    </footer>
  );
}
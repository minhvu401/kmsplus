"use client";

import React from "react";
import { Flex } from "antd";
import Footer from "./footer";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      {/* Outer container that vertically stacks content and footer */}
      <Flex vertical justify="space-between" style={{ minHeight: "100vh" }}>
        
        {/* Content section */}
        <Flex vertical flex={1} style={{ padding: "0.25rem 2rem 0 2rem" }}>
          <Flex
            vertical
            style={{
              backgroundColor: "white",
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderRadius: "1rem",
              padding: "2rem",
              maxWidth: "80rem",
              margin: "0 auto",
              width: "100%",
              flex: 1,
            }}
          >
            {children}
          </Flex>
        </Flex>

        {/* Footer always at bottom */}
        <Footer />
      </Flex>
    </main>
  );
}

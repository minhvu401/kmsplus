"use client";

import React from "react";
import { Flex } from "antd";
import Footer from "./footer";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ minHeight: "100vh" }}>
      {/* Outer container that vertically stacks content and footer */}
      <Flex vertical justify="space-between" style={{ minHeight: "100vh" }}>
        
        {/* Content section */}
        <Flex vertical flex={1} style={{ padding: "0" }}>
          {children}
        </Flex>

        {/* Footer always at bottom */}
        <Footer />
      </Flex>
    </main>
  );
}

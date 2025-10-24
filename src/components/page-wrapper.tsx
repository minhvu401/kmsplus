"use client";

import React from "react";
import Footer from "./footer";
import Sidebar from "./sidebar";
import Header from "./header";

export default function PageWrapper({ children }: { children: React.ReactNode }) {
    return (
        <main className="bg-gray-50 min-h-screen">
            {/* <Header /> */}
            {/* <Sidebar /> */}
            <div className="flex-1 p-8 pt-4 pl-8">
                <div className="bg-white shadow-sm rounded-2xl p-8 max-w-7xl mx-auto">
                    {children}
                </div>
                <Footer />
            </div>
        </main>
    );
}

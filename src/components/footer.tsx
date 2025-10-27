"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-between border-t mt-12 pt-6 text-sm text-gray-500">
      <p>© 2025 - <span className="font-semibold">KMSPlus</span>. Designed by <span className="font-semibold">KMS Team</span>. All rights reserved.</p>

      <div className="flex gap-4 mt-2 sm:mt-0">
        <Link href="/faqs" className="hover:text-blue-600 transition">FAQs</Link>
        <Link href="/privacy-policy" className="hover:text-blue-600 transition">Privacy Policy</Link>
        <Link href="/terms-and-condition" className="hover:text-blue-600 transition">Terms & Condition</Link>
      </div>
    </footer>
  );
}

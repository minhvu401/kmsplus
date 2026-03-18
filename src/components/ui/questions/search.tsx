"use client"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { SearchOutlined } from "@ant-design/icons"
import { Input } from "antd"

export default function Search({ placeholder }: { placeholder: string }) {

  // These give access to:
  const searchParams = useSearchParams(); // The current query parameters.
  const pathname = usePathname(); // The current path (like /invoices).
  const { replace } = useRouter(); // The ability to replace the URL (without reloading).

  // Reduced debounce to 200ms for faster response
  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams); // Makes a mutable copy of the read-only searchParams 
    params.set('page', '1'); // Reset to the 1st page when searching
    if (term) {
      params.set('query', term); // Add search term to query
    } else {
      params.delete('query'); // If input is empty, remove search term
    }
    replace(`${pathname}?${params.toString()}`); // Update the current URL in the browser without causing a full page reload.
  }, 200);

  return (
    <Input
      className="w-full"
      size="large"
      prefix={<SearchOutlined style={{ color: "#60a5fa", fontSize: "18px" }} />}
      placeholder={placeholder}
      onChange={(e) => {
        handleSearch(e.target.value)
      }}
      style={{
        fontSize: "14px",
        borderRadius: "0.375rem",
        borderColor: "#e5e7eb",
      }}
      // The defaultValue ensures that if there's a query in the URL already, it appears in the input when the page loads.
      defaultValue={searchParams.get("query")?.toString()}
    />
  )
}

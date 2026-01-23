"use client"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useDebouncedCallback } from "use-debounce"
import { SearchOutlined } from "@ant-design/icons"
import { Input } from "antd"

export default function Search({ placeholder }: { placeholder: string }) {
  // These give access to:
  const searchParams = useSearchParams() // The current query parameters.
  const pathname = usePathname() // The current path (like /invoices).
  const { replace } = useRouter() // The ability to replace the URL (without reloading).

  // use-debounce adds a delay (300ms in this case) before executing a function. Prevents excessive updates while the user is typing.
  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams) // Makes a mutable copy of the read-only searchParams
    params.set("page", "1") // Reset to the 1st page when searching
    if (term) {
      params.set("query", term) // Add search term to query
    } else {
      params.delete("query") // If input is empty, remove search term
    }
    replace(`${pathname}?${params.toString()}`) // Update the current URL in the browser without causing a full page reload.
  }, 300)

  return (
    <Input
      className="w-full"
      size="large"
      prefix={<SearchOutlined className="text-gray-500" />}
      placeholder={placeholder}
      onChange={(e) => {
        handleSearch(e.target.value)
      }}
      // The defaultValue ensures that if there's a query in the URL already, it appears in the input when the page loads.
      defaultValue={searchParams.get("query")?.toString()}
    />
  )
}

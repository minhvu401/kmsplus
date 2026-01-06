/**
 * Sanitize text input để chống XSS
 * Loại bỏ các tag HTML và script, nhưng giữ lại khoảng trắng
 */
export function sanitizeInput(input: string): string {
  if (!input) return ""

  // Loại bỏ tag HTML/script
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, "") // Remove script tags
    .replace(/<[^>]+>/g, "") // Remove all HTML tags
    .trim() // Chỉ trim đầu và cuối, không ảnh hưởng đến space ở giữa
}

/**
 * Escape HTML special characters để hiển thị an toàn
 */
export function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

/**
 * Validate và sanitize title input
 * Max 255 ký tự (theo AC1 requirement)
 * Giữ lại khoảng trắng ở giữa
 */
export function sanitizeTitle(title: string): string {
  // Loại bỏ script tags, HTML tags, sau đó trim đầu/cuối
  return title
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim()
    .substring(0, 255)
}

/**
 * Validate và sanitize description input
 * Max 1000 ký tự (theo AC2 requirement)
 * Giữ lại khoảng trắng ở giữa
 */
export function sanitizeDescription(description: string): string {
  // Loại bỏ script tags, HTML tags, sau đó trim đầu/cuối
  return description
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .trim()
    .substring(0, 1000)
}
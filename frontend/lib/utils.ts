export function parseCSVEmails(csvText: string): string[] {
  const lines = csvText.split('\n');
  const emails: string[] = [];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Try to extract email from CSV line (could be just email or "name,email")
    const parts = trimmed.split(',');
    for (const part of parts) {
      const email = part.trim().replace(/^"|"$/g, '');
      if (emailRegex.test(email)) {
        emails.push(email);
        break; // Only take first valid email per line
      }
    }
  }

  return [...new Set(emails)]; // Remove duplicates
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
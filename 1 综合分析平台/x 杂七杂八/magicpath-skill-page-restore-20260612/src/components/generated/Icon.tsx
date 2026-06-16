const ICONS: Record<string, {
  viewBox: string;
  body: string;
}> = {
  workbench: {
    viewBox: "0 0 48 48",
    body: '<path d="M12 33H4V7H44V33H36H12Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M16 22V26" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 33V39" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 18V26" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M32 14V26" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 41H36" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "left-bar": {
    viewBox: "0 0 48 48",
    body: '<rect x="6" y="6" width="36" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M16 6V42" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 42H19" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 6H19" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "right-bar": {
    viewBox: "0 0 48 48",
    body: '<rect x="6" y="6" width="36" height="36" rx="3" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M32 6V42" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 42H35" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 6H35" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  notes: {
    viewBox: "0 0 48 48",
    body: '<path d="M8 6C8 4.89543 8.89543 4 10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M16 20H32" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 28H32" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  form: {
    viewBox: "0 0 48 48",
    body: '<rect x="4" y="8" width="40" height="32" rx="2" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M4 29H44" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 19H44" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M17 40V19" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 38V17" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M44 38V17" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M31 40V19" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 40H39" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  connect: {
    viewBox: "0 0 48 48",
    body: '<path fill-rule="evenodd" clip-rule="evenodd" d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M10 42C13.3137 42 16 39.3137 16 36C16 32.6863 13.3137 30 10 30C6.68629 30 4 32.6863 4 36C4 39.3137 6.68629 42 10 42Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M38 44C41.3137 44 44 41.3137 44 38C44 34.6863 41.3137 32 38 32C34.6863 32 32 34.6863 32 38C32 41.3137 34.6863 44 38 44Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M22 28C26.4183 28 30 24.4183 30 20C30 15.5817 26.4183 12 22 12C17.5817 12 14 15.5817 14 20C14 24.4183 17.5817 28 22 28Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M34 12C36.2091 12 38 10.2091 38 8C38 5.79086 36.2091 4 34 4C31.7909 4 30 5.79086 30 8C30 10.2091 31.7909 12 34 12Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M11 11L15 15" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 12L28 14" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 33.5L28 26" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 31L18 27" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  book: {
    viewBox: "0 0 48 48",
    body: '<path d="M8 40C8 36 8 10 8 10C8 6.68629 10.8654 4 14.4 4H40V36C40 36 19.9815 36 14.4 36C9.36225 36 8 36.6842 8 40Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M12 44H40V36H12C9.79086 36 8 37.7909 8 40C8 42.2091 9.79086 44 12 44Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "book-open": {
    viewBox: "0 0 48 48",
    body: '<path d="M5 7H16C20.4183 7 24 10.5817 24 15V42C24 38.6863 21.3137 36 18 36H5V7Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M43 7H32C27.5817 7 24 10.5817 24 15V42C24 38.6863 26.6863 36 30 36H43V7Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>'
  },
  tips: {
    viewBox: "0 0 48 48",
    body: '<path d="M40 20C40 26.8077 35.7484 32.6224 29.7555 34.9336H24H18.2445C12.2516 32.6224 8 26.8077 8 20C8 11.1634 15.1634 4 24 4C32.8366 4 40 11.1634 40 20Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M29.7557 34.9336L29.0766 43.0831C29.0334 43.6014 28.6001 44 28.08 44H19.9203C19.4002 44 18.9669 43.6014 18.9238 43.0831L18.2446 34.9336" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 17V23L24 20L30 23V17" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  send: {
    viewBox: "0 0 48 48",
    body: '<path d="M43 5L29.7 43L22.1 25.9L5 18.3L43 5Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M43.0001 5L22.1001 25.9" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  paperclip: {
    viewBox: "0 0 48 48",
    body: '<path d="M26.1219 37.4352C26.1219 37.4352 37.4356 26.1215 40.264 23.293C43.0924 20.4646 44.5066 13.3935 39.5569 8.4438C34.6071 3.49405 27.5361 4.90826 24.7076 7.73669C21.8792 10.5651 7.02998 25.4144 5.61576 26.8286C4.20155 28.2428 2.08023 33.1925 6.32287 37.4352C10.5655 41.6778 15.5153 39.5565 16.9295 38.1423C18.3437 36.7281 33.9 21.1717 35.3142 19.7575C36.7285 18.3433 37.4356 14.8078 35.3142 12.6864C33.1929 10.5651 29.6574 11.2722 28.2432 12.6864C26.829 14.1007 14.8082 26.1215 14.8082 26.1215" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "check-one": {
    viewBox: "0 0 48 48",
    body: '<path d="M24 44C29.5228 44 34.5228 41.7614 38.1421 38.1421C41.7614 34.5228 44 29.5228 44 24C44 18.4772 41.7614 13.4772 38.1421 9.85786C34.5228 6.23858 29.5228 4 24 4C18.4772 4 13.4772 6.23858 9.85786 9.85786C6.23858 13.4772 4 18.4772 4 24C4 29.5228 6.23858 34.5228 9.85786 38.1421C13.4772 41.7614 18.4772 44 24 44Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M16 24L22 30L34 18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "close-one": {
    viewBox: "0 0 48 48",
    body: '<path d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M29.6567 18.3432L18.343 29.6569" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18.3433 18.3432L29.657 29.6569" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "loading-four": {
    viewBox: "0 0 48 48",
    body: '<path d="M4 24C4 35.0457 12.9543 44 24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  plus: {
    viewBox: "0 0 48 48",
    body: '<path d="M24.0605 10L24.0239 38" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 24L38 24" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "chevron-down": {
    viewBox: "0 0 48 48",
    body: '<path d="M36 18L24 30L12 18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  search: {
    viewBox: "0 0 48 48",
    body: '<path d="M21 38C30.3888 38 38 30.3888 38 21C38 11.6112 30.3888 4 21 4C11.6112 4 4 11.6112 4 21C4 30.3888 11.6112 38 21 38Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M33.2216 33.2217L44 44.0001" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  message: {
    viewBox: "0 0 48 48",
    body: '<path d="M44.0001 24C44.0001 35.0457 35.0458 44 24.0001 44C18.0266 44 4.00006 44 4.00006 44C4.00006 44 4.00006 29.0722 4.00006 24C4.00006 12.9543 12.9544 4 24.0001 4C35.0458 4 44.0001 12.9543 44.0001 24Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 18L32 18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 26H32" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 34H24" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "edit-one": {
    viewBox: "0 0 48 48",
    body: '<path d="M29 4H9C7.89543 4 7 4.89543 7 6V42C7 43.1046 7.89543 44 9 44H37C38.1046 44 39 43.1046 39 42V20.0046" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 18H21" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M13 28H25" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M40.9991 6.00098L29.0044 17.9958" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "edit-two": {
    viewBox: "0 0 48 48",
    body: '<path d="M42 26V40C42 41.1046 41.1046 42 40 42H8C6.89543 42 6 41.1046 6 40V8C6 6.89543 6.89543 6 8 6L22 6" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 26.7199V34H21.3172L42 13.3081L34.6951 6L14 26.7199Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>'
  },
  delete: {
    viewBox: "0 0 48 48",
    body: '<path d="M9 10V42C9 43.1046 9.89543 44 11 44H37C38.1046 44 39 43.1046 39 42V10" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 10H42" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M19 10V6C19 4.89543 19.8954 4 21 4H27C28.1046 4 29 4.89543 29 6V10" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M20 20V34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/><path d="M28 20V34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'
  },
  download: {
    viewBox: "0 0 48 48",
    body: '<path d="M6 24.0083V42H42V24" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 23L24 32L15 23" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23.9917 6V32" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  filter: {
    viewBox: "0 0 48 48",
    body: '<path d="M6 9L20.4 25.8178V38.4444L27.6 42V25.8178L42 9H6Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/>'
  },
  user: {
    viewBox: "0 0 48 48",
    body: '<circle cx="24" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 44C42 34.0589 33.9411 26 24 26C14.0589 26 6 34.0589 6 44" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  sort: {
    viewBox: "0 0 48 48",
    body: '<path d="M23 8H43" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 41L6 33" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 7V41" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 18H39" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 28H35" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M23 38H31" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  more: {
    viewBox: "0 0 48 48",
    body: '<circle cx="12" cy="24" r="3" fill="currentColor"/><circle cx="24" cy="24" r="3" fill="currentColor"/><circle cx="36" cy="24" r="3" fill="currentColor"/>'
  },
  refresh: {
    viewBox: "0 0 48 48",
    body: '<path d="M42 8V20H30" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 24C6 14.0589 14.0589 6 24 6C31.1775 6 37.3748 10.2019 40.2621 16.2804" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 40V28H18" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M42 24C42 33.9411 33.9411 42 24 42C16.8225 42 10.6252 37.7981 7.73792 31.7196" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "check-correct": {
    viewBox: "0 0 48 48",
    body: '<path d="M42 20V39C42 40.6569 40.6569 42 39 42H9C7.34315 42 6 40.6569 6 39V9C6 7.34315 7.34315 6 9 6H30" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 20L26 28L41 7" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "file-excel": {
    viewBox: "0 0 48 48",
    body: '<path d="M10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6C8 4.89543 8.89543 4 10 4Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M29 18H19V34H29" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M29 26H19" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "file-word": {
    viewBox: "0 0 48 48",
    body: '<path d="M10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6C8 4.89543 8.89543 4 10 4Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path d="M16.0083 20L19.0083 34L24.0083 24L29.0083 34L32.0083 20" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "file-pdf": {
    viewBox: "0 0 48 48",
    body: '<path d="M10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6C8 4.89543 8.89543 4 10 4Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linejoin="round"/><path fill-rule="evenodd" clip-rule="evenodd" d="M18 18H30V25.9917L18.0083 26L18 18Z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 18V34" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>'
  },
  picture: {
    viewBox: "0 0 48 48",
    body: '<path d="M39 6H9C7.34315 6 6 7.34315 6 9V39C6 40.6569 7.34315 42 9 42H39C40.6569 42 42 40.6569 42 39V9C42 7.34315 40.6569 6 39 6Z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 23C20.7614 23 23 20.7614 23 18C23 15.2386 20.7614 13 18 13C15.2386 13 13 15.2386 13 18C13 20.7614 15.2386 23 18 23Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M27.7901 26.2194C28.6064 25.1269 30.2528 25.1538 31.0329 26.2725L39.8077 38.8561C40.7322 40.182 39.7835 42.0001 38.1671 42.0001H16L27.7901 26.2194Z" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  },
  "file-text": {
    viewBox: "0 0 48 48",
    body: '<path d="M10 44H38C39.1046 44 40 43.1046 40 42V14H30V4H10C8.89543 4 8 4.89543 8 6V42C8 43.1046 8.89543 44 10 44Z" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M30 4L40 14" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 22V36" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 22H24L30 22" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>'
  }
};
const ALIASES: Record<string, string> = {
  brand: "workbench",
  collapse: "left-bar",
  file: "file-excel",
  image: "picture",
  word: "file-word",
  pdf: "file-pdf",
  table: "form",
  graph: "connect",
  chat: "message",
  "chat-ref": "message",
  edit: "edit-two",
  task: "edit-one",
  spin: "loading-four",
  fail: "close-one",
  clip: "paperclip",
  check: "check-one"
};
export const Icon = ({
  name,
  className = ""
}: {
  name: string;
  className?: string;
}) => {
  const key = ALIASES[name] || name;
  const icon = ICONS[key] || ICONS.notes;
  return <span className={`mp-icon mp-icon--${name} ${className}`} aria-hidden="true">
      <svg viewBox={icon.viewBox} focusable="false" dangerouslySetInnerHTML={{
      __html: icon.body
    }} />
    </span>;
};

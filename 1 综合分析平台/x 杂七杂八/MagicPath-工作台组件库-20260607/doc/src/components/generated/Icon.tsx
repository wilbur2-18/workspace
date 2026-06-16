const paths: Record<string, string[]> = {
  workbench: ['M4 6h16v12H4z', 'M8 22h8M12 18v4M8 10v4M12 9v5M16 8v6'],
  panel: ['M4 5h16v14H4z', 'M9 5v14'],
  split: ['M4 5h16v14H4z', 'M14 5v14'],
  plus: ['M12 5v14M5 12h14'],
  search: ['M11 11a6 6 0 1 0 0.1 0', 'm16 16 4 4'],
  book: ['M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21.5z', 'M5 5.5v16M12 3v16'],
  chevron: ['m9 18 6-6-6-6'],
  chat: ['M7 8h10M7 12h7M5 19l3-3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v6a3 3 0 0 0 3 3'],
  tool: ['M14.7 6.3a4 4 0 0 0-5.1 5.1L4 17v3h3l5.6-5.6a4 4 0 0 0 5.1-5.1l-2.4 2.4-2-2z'],
  brain: ['M9 5a3 3 0 0 0-4 4 3 3 0 0 0 1 5.8V17a3 3 0 0 0 3 3', 'M15 5a3 3 0 0 1 4 4 3 3 0 0 1-1 5.8V17a3 3 0 0 1-3 3', 'M9 5v15M15 5v15M9 10h6M9 15h6'],
  folder: ['M4 7h6l2 2h8v10H4z', 'M4 7v12'],
  database: ['M5 6c0-1.7 3.1-3 7-3s7 1.3 7 3-3.1 3-7 3-7-1.3-7-3z', 'M5 6v12c0 1.7 3.1 3 7 3s7-1.3 7-3V6', 'M5 12c0 1.7 3.1 3 7 3s7-1.3 7-3'],
  map: ['m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2z', 'M9 4v14M15 6v14'],
  paperclip: ['m8 13 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l8-8'],
  send: ['M20 4 9 15', 'm20 4-6 17-4-6-6-4z'],
  file: ['M7 3h7l4 4v14H7z', 'M13 3v5h5M9 13h6M9 17h5'],
  table: ['M4 5h16v14H4z', 'M4 11h16M4 15h16M10 5v14M15 5v14'],
  robot: ['M7 10h10a3 3 0 0 1 3 3v5H4v-5a3 3 0 0 1 3-3z', 'M12 6v4M9 15h.01M15 15h.01M10 19h4'],
  download: ['M12 4v10', 'm8 10 4 4 4-4', 'M5 20h14'],
  more: ['M6 12h.01M12 12h.01M18 12h.01'],
  close: ['M6 6l12 12M18 6 6 18'],
  refresh: ['M20 12a8 8 0 1 1-2.3-5.7', 'M20 4v8h-8'],
  stop: ['M7 7h10v10H7z'],
  info: ['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z', 'M12 10v6M12 7h.01'],
  check: ['M20 6 9 17l-5-5'],
  warn: ['M12 3 2 20h20z', 'M12 9v5M12 17h.01'],
  arrow: ['M5 12h14', 'm13 6 6 6-6 6'],
  back: ['M19 12H5', 'm11 6-6 6 6 6'],
  maximize: ['M8 3H3v5M16 3h5v5M8 21H3v-5M21 16v5h-5'],
};

export function Icon({ name }: { name: string }) {
  const shape = paths[name] || paths.plus;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {shape.map((d, index) => (
        <path key={`${name}-${index}`} d={d} />
      ))}
    </svg>
  );
}

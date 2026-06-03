// demo-file-icons.js
// Central file type icon grouping for the zero-build demo.
(function (global) {
  const SHEET_EXTS = new Set(['XLSX', 'XLS', 'CSV']);
  const DOC_EXTS = new Set(['DOCX', 'DOC', 'WPS']);
  const IMAGE_EXTS = new Set(['JPG', 'JPEG', 'PNG', 'TIFF', 'TIF', 'BMP']);
  const TEXT_EXTS = new Set(['MD', 'MARKDOWN', 'TXT']);
  const CODE_EXTS = new Set(['JSON', 'XML']);

  function normalizeExt(format, fileName) {
    let ext = String(format || '').trim().replace(/^\./, '').toUpperCase();
    if (ext && ext.includes('/')) {
      if (ext.includes('PDF')) ext = 'PDF';
      else if (ext.includes('SPREADSHEET') || ext.includes('EXCEL') || ext.includes('CSV')) ext = 'XLSX';
      else if (ext.includes('WORD') || ext.includes('DOCUMENT')) ext = 'DOCX';
      else if (ext.includes('IMAGE')) ext = 'PNG';
      else if (ext.includes('JSON')) ext = 'JSON';
      else if (ext.includes('XML')) ext = 'XML';
      else ext = '';
    }
    if (!ext) {
      const m = String(fileName || '').trim().match(/\.([a-z0-9]+)$/i);
      ext = m ? String(m[1] || '').toUpperCase() : '';
    }
    return ext;
  }

  function groupFor(format, fileName) {
    const ext = normalizeExt(format, fileName);
    if (ext === 'PDF') return 'pdf';
    if (SHEET_EXTS.has(ext)) return 'sheet';
    if (DOC_EXTS.has(ext)) return 'doc';
    if (IMAGE_EXTS.has(ext)) return 'image';
    if (TEXT_EXTS.has(ext)) return 'text';
    if (CODE_EXTS.has(ext)) return 'code';
    return 'unknown';
  }

  function iconFor(format, fileName) {
    const group = groupFor(format, fileName);
    const meta = {
      pdf: { iconName: 'file-pdf', toneClass: 'is-pdf' },
      sheet: { iconName: 'file-sheet', toneClass: 'is-sheet' },
      doc: { iconName: 'file-doc', toneClass: 'is-doc' },
      image: { iconName: 'file-image', toneClass: '' },
      text: { iconName: 'file-text', toneClass: '' },
      code: { iconName: 'file-code', toneClass: 'is-data' },
      unknown: { iconName: 'file-lines', toneClass: '' },
    }[group];
    return {
      group,
      iconName: meta.iconName,
      toneClass: meta.toneClass,
    };
  }

  global.DemoFileIcons = {
    normalizeExt,
    groupFor,
    iconFor,
  };
})(typeof window !== 'undefined' ? window : globalThis);

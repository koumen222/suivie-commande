export const ENABLE_ENHANCED_UI = (() => {
  const value = import.meta.env?.VITE_ENABLE_ENHANCED_UI;
  if (typeof value === 'string') {
    return value.trim().toLowerCase() !== 'false';
  }
  return true;
})();

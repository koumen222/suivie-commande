import { google } from 'googleapis';

export async function normalizeRange(opts: {
  sheets: ReturnType<typeof google['sheets']>;
  spreadsheetId: string;
  requestedRange?: string; // ex: "Feuille1!A:Z" ou "A:Z"
}): Promise<{ finalRange: string; tabs: string[] }> {
  const { sheets, spreadsheetId, requestedRange } = opts;
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const tabs = (meta.data.sheets || [])
    .map(s => s.properties?.title)
    .filter((t): t is string => !!t);
  if (!tabs.length) throw new Error('Aucun onglet trouvé dans la feuille.');

  // Détecte si requestedRange contient explicitement un onglet (format "<tab>!A:Z" / "<tab>!A1:B100")
  const hasTab = !!requestedRange?.includes('!');
  const parse = (r: string) => {
    const [tabPart, cells] = r.split('!');
    return { tabPart, cells };
  };

  // Helper pour quoter un onglet avec espace
  const quoteTab = (t: string) => (t.includes(' ') ? `'${t}'` : t);

  let finalTab: string;
  let cells = 'A:Z';

  if (!requestedRange) {
    // Pas de range → 1er onglet + A:Z
    finalTab = tabs[0]!;
  } else if (hasTab) {
    const { tabPart, cells: c } = parse(requestedRange);
    // Nettoie les quotes si déjà présentes
    const rawTab = tabPart.replace(/^'/, '').replace(/'$/, '');
    cells = c || 'A:Z';
    // Onglet existe ?
    if (tabs.includes(rawTab)) {
      finalTab = rawTab;
    } else {
      console.warn(`[RANGE] Onglet "${rawTab}" introuvable. Bascule sur "${tabs[0]}".`);
      finalTab = tabs[0]!;
      // si l'utilisateur a envoyé seulement "<onglet>!" sans cellule, garde A:Z
      if (!cells) cells = 'A:Z';
    }
  } else {
    // Range sans tab (ex. "A:Z") → 1er onglet
    finalTab = tabs[0]!;
    cells = requestedRange;
  }

  const finalRange = `${quoteTab(finalTab)}!${cells || 'A:Z'}`;
  return { finalRange, tabs };
}

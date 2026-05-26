export const DEFAULT_GENE_EDITING_QUERY =
  'CRISPR OR Cas9 OR Cas12 OR Cas13 OR "base editing" OR "prime editing" OR "RNA editing" OR TALEN OR ZFN OR "zinc finger nuclease" OR "gene-edited"';

export const geneEditingCategories = [
  {
    label: "All gene editing",
    query: DEFAULT_GENE_EDITING_QUERY,
    description:
      "CRISPR, base editing, prime editing, RNA editing, TALEN, and ZFN.",
  },
  {
    label: "CRISPR",
    query: "CRISPR OR CRISPR-Cas9 OR Cas9 OR Cas12 OR Cas13",
    description: "Cas-based DNA and RNA editing studies.",
  },
  {
    label: "Base editing",
    query: '"base editing" OR "base editor"',
    description: "Single-base conversion therapies.",
  },
  {
    label: "Prime editing",
    query: '"prime editing" OR "prime editor"',
    description: "Search-and-replace style gene editing.",
  },
  {
    label: "RNA editing",
    query: '"RNA editing" OR Cas13 OR ADAR',
    description: "RNA-targeting and transcript-editing approaches.",
  },
  {
    label: "TALEN / ZFN",
    query: 'TALEN OR "zinc finger nuclease" OR ZFN',
    description: "Older programmable nuclease platforms.",
  },
  {
    label: "In vivo delivery",
    query: '"in vivo" gene editing OR "lipid nanoparticle" OR AAV',
    description: "Therapies delivered directly into the body.",
  },
];

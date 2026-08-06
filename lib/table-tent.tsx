import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

// Kept in its own module so @react-pdf (a big dep) is code-split — the QR studio
// dynamically imports it only when a PDF is requested. The default PDF font is
// Latin-only (no CJK/macrons), so venue names are ASCII-folded for print.
function ascii(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "") || "Menu";
}

const tent = StyleSheet.create({
  page: { backgroundColor: "#14110f", color: "#f7f4ee", padding: 20, alignItems: "center", justifyContent: "center" },
  card: {
    width: "100%",
    height: "100%",
    borderWidth: 1,
    borderColor: "#b08d4f",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  name: { fontSize: 22, letterSpacing: 2, marginBottom: 14, textAlign: "center" },
  scan: { fontSize: 9, letterSpacing: 3, color: "#b08d4f", textTransform: "uppercase", marginBottom: 14 },
  qrFrame: { padding: 8, backgroundColor: "#f7f4ee", borderRadius: 4 },
  qr: { width: 150, height: 150 },
  table: { marginTop: 16, fontSize: 12 },
});

/** A single A6 table tent for one code. */
export async function generateTableTentPdf(
  qrPngDataUrl: string,
  tableLabel: string,
  venueName: string,
): Promise<Blob> {
  const doc = (
    <Document title={`${ascii(venueName)} table tent`}>
      <Page size="A6" style={tent.page}>
        <View style={tent.card}>
          <Text style={tent.name}>{ascii(venueName)}</Text>
          <Text style={tent.scan}>Scan for our menu</Text>
          <View style={tent.qrFrame}>
            <Image src={qrPngDataUrl} style={tent.qr} />
          </View>
          {tableLabel ? <Text style={tent.table}>Table {tableLabel}</Text> : null}
        </View>
      </Page>
    </Document>
  );
  return pdf(doc).toBlob();
}

const sheet = StyleSheet.create({
  page: { backgroundColor: "#ffffff", color: "#14110f", padding: 28 },
  header: { fontSize: 14, marginBottom: 4, textAlign: "center" },
  sub: { fontSize: 9, color: "#8a827a", marginBottom: 16, textAlign: "center", textTransform: "uppercase", letterSpacing: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-start" },
  cell: { width: "33.33%", alignItems: "center", paddingVertical: 12 },
  qrFrame: { padding: 6, borderWidth: 1, borderColor: "#d8cdb8", borderRadius: 4 },
  qr: { width: 120, height: 120 },
  label: { marginTop: 8, fontSize: 11 },
});

/** An A4 print sheet — a grid of labelled codes, for bulk table QR printing. */
export async function generateQrSheetPdf(
  codes: { png: string; label: string }[],
  venueName: string,
): Promise<Blob> {
  const doc = (
    <Document title={`${ascii(venueName)} table QR codes`}>
      <Page size="A4" style={sheet.page} wrap>
        <Text style={sheet.header}>{ascii(venueName)}</Text>
        <Text style={sheet.sub}>Scan for our menu</Text>
        <View style={sheet.grid}>
          {codes.map((c, i) => (
            <View key={i} style={sheet.cell} wrap={false}>
              <View style={sheet.qrFrame}>
                <Image src={c.png} style={sheet.qr} />
              </View>
              <Text style={sheet.label}>{c.label}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  );
  return pdf(doc).toBlob();
}

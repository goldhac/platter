import { Document, Image, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

// Kept in its own module so @react-pdf (a big dep) is code-split — the QR page
// dynamically imports this only when a PDF is requested. ASCII text only: the
// default PDF font doesn't carry CJK or macron glyphs.

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#14110f",
    color: "#f7f4ee",
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
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
  name: { fontSize: 24, letterSpacing: 2, marginBottom: 14 },
  scan: {
    fontSize: 9,
    letterSpacing: 3,
    color: "#b08d4f",
    textTransform: "uppercase",
    marginBottom: 14,
  },
  qrFrame: { padding: 8, backgroundColor: "#f7f4ee", borderRadius: 4 },
  qr: { width: 150, height: 150 },
  table: { marginTop: 16, fontSize: 12, color: "#f7f4ee" },
  foot: { marginTop: 6, fontSize: 8, color: "#8a827a" },
});

export async function generateTableTentPdf(qrPngDataUrl: string, tableLabel: string): Promise<Blob> {
  const doc = (
    <Document title="Jin Canting table tent">
      <Page size="A6" style={styles.page}>
        <View style={styles.card}>
          <Text style={styles.name}>JIN CANTING</Text>
          <Text style={styles.scan}>Scan for our menu</Text>
          <View style={styles.qrFrame}>
            <Image src={qrPngDataUrl} style={styles.qr} />
          </View>
          {tableLabel ? <Text style={styles.table}>Table {tableLabel}</Text> : null}
          <Text style={styles.foot}>De Geogold Hotel</Text>
        </View>
      </Page>
    </Document>
  );
  return pdf(doc).toBlob();
}

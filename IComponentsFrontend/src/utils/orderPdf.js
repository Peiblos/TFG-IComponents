import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const getStatusLabel = (status) => {
  const labels = {
    cart: "Carrito",
    paid: "Pagado",
    shipped: "Enviado",
    delivered: "Entregado",
    cancelled: "Cancelado",
    rejected: "Rechazado",
    pending: "Pendiente",
  };

  return labels[status] || status || "Sin estado";
};

const formatDate = (date) => {
  if (!date) return "Sin fecha";

  return new Date(date.replace(" ", "T")).toLocaleString("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  });
};

const formatFileDate = (date) => {
  if (!date) return "sin_fecha";

  return new Date(date.replace(" ", "T")).toISOString().slice(0, 10);
};

export const downloadOrderPdf = (order) => {
  const doc = new jsPDF();
  const fileDate = formatFileDate(order.createdAt);

  doc.setFontSize(22);
  doc.text("IComponents", 14, 18);

  doc.setFontSize(11);
  doc.text("Factura / Detalle de pedido", 14, 26);

  doc.setFontSize(10);
  doc.text(`Pedido #${order.id}`, 150, 18);
  doc.text(`Fecha: ${formatDate(order.createdAt)}`, 150, 25);
  doc.text(`Estado: ${getStatusLabel(order.status)}`, 150, 32);

  doc.setFontSize(13);
  doc.text("Datos del pedido", 14, 45);

  doc.setFontSize(10);
  doc.text(`Usuario: ${order.owner?.email || "Sin usuario"}`, 14, 53);
  doc.text(`Productos: ${order.lines?.length || 0}`, 14, 60);

  autoTable(doc, {
    startY: 72,
    head: [["Producto", "SKU", "Referencia", "Cantidad", "Precio ud.", "Subtotal"]],
    body:
      order.lines?.map((line) => [
        line.product?.name || "Producto sin nombre",
        line.product?.sku || "-",
        line.product?.manufacturerReference  || "-",
        String(line.quantity),
        `${line.unitPrice}€`,
        `${line.subtotal}€`,
      ]) || [],
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  });

  const finalY = doc.lastAutoTable.finalY + 14;

doc.setFontSize(12);
doc.text("Total del pedido:", 14, finalY);

doc.setFontSize(18);
doc.text(`${order.total}€`, 14, finalY + 10);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    "Documento generado desde el panel de administración de IComponents.",
    14,
    285
  );

  doc.save(`pedido_${order.id}_${fileDate}.pdf`);
};
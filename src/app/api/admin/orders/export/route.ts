import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || "PAID"; // Default to PAID orders

  // Fetch orders with the specified status
  const orders = await prisma.order.findMany({
    where: {
      status: status as "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED",
    },
    include: {
      user: { select: { name: true, email: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV content
  // Pirate Ship CSV format columns
  const headers = [
    "Order ID",
    "Name",
    "Company",
    "Address Line 1",
    "Address Line 2",
    "City",
    "State",
    "Postal Code",
    "Country",
    "Email",
    "Phone",
    "Weight (oz)",
    "Item Description",
    "Item Quantity",
    "Order Total",
    "Order Date",
  ];

  const rows = orders.map((order) => {
    // Parse shipping address JSON
    let shipping = {
      firstName: "",
      lastName: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      country: "US",
      phone: "",
    };

    try {
      if (order.shippingAddress) {
        shipping = JSON.parse(order.shippingAddress);
      }
    } catch {
      // Use defaults if parsing fails
    }

    const fullName = `${shipping.firstName || ""} ${shipping.lastName || ""}`.trim() || order.user.name || "Customer";

    // Combine all items into a description
    const itemDescriptions = order.items
      .map((item) => `${item.product.name} x${item.quantity}`)
      .join("; ");

    const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

    // Estimate weight - trading cards are light, ~1oz per card
    const estimatedWeight = Math.max(1, totalQuantity); // At least 1 oz

    return [
      order.orderNumber,
      fullName,
      "", // Company
      shipping.address1 || "",
      shipping.address2 || "",
      shipping.city || "",
      shipping.state || "",
      shipping.zip || "",
      shipping.country || "US",
      order.user.email || "",
      shipping.phone || "",
      estimatedWeight.toString(),
      itemDescriptions,
      totalQuantity.toString(),
      Number(order.total).toFixed(2),
      new Date(order.createdAt).toLocaleDateString(),
    ];
  });

  // Create CSV string
  const escapeCsvField = (field: string) => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map(escapeCsvField).join(",")),
  ].join("\n");

  // Return as downloadable CSV
  const filename = `orders-${status.toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

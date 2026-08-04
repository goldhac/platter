import { redirect } from "next/navigation";

// v1 has a single tenant; the root goes straight to the menu.
export default function Home() {
  redirect("/menu");
}

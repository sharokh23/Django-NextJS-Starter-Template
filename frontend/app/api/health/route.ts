import { NextResponse } from "next/server";

/**
 * Dedicated health endpoint for container HEALTHCHECKs and load-balancer
 * target groups — survives changes to the demo routes.
 */
export async function GET() {
  return NextResponse.json({ status: "ok" });
}

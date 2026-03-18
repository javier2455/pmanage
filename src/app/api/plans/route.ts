import { NextResponse } from "next/server"

const PLANS_URL = "https://psearch.dveloxsoft.com/apiv1/plans"

export async function GET() {
  try {
    const res = await fetch(PLANS_URL, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    })

    if (!res.ok) {
      return NextResponse.json(
        { error: "Error al obtener los planes" },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("[api/plans] Error:", error)
    return NextResponse.json(
      { error: "Error al conectar con el servidor de planes" },
      { status: 500 }
    )
  }
}

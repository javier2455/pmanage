import React from 'react'

export default function LayoutPage({ children }: { children: React.ReactNode }) {
    return (
        <section className="p-6">{children}</section>
    )
}

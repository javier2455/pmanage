"use client";

import { useEffect, useRef, useState } from "react";

export interface UseInViewOptions extends IntersectionObserverInit {
    once?: boolean;
}

export function useInView<T extends Element = HTMLDivElement>(
    opts: UseInViewOptions = {},
) {
    const {
        once = true,
        root = null,
        rootMargin = "0px 0px -10% 0px",
        threshold = 0.15,
    } = opts;

    const ref = useRef<T | null>(null);
    const [inView, setInView] = useState<boolean>(
        () => typeof IntersectionObserver === "undefined",
    );

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        if (typeof IntersectionObserver === "undefined") return;

        const io = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setInView(true);
                    if (once) io.disconnect();
                } else if (!once) {
                    setInView(false);
                }
            },
            { root, rootMargin, threshold },
        );

        io.observe(node);
        return () => io.disconnect();
    }, [once, root, rootMargin, threshold]);

    return { ref, inView };
}

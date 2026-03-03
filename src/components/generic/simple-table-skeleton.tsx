"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const ROWS = 5;

export function SimpleTableSkeleton() {
    return (
        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="text-left py-3 px-4 font-semibold text-foreground">
                                    <Skeleton className="h-5 w-32" />
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-foreground">
                                    <Skeleton className="h-5 w-20" />

                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-foreground">
                                    <Skeleton className="h-5 w-20" />
                                </th>
                                <th className="text-left py-3 px-4 font-semibold text-foreground">
                                    <Skeleton className="h-5 w-20" />
                                </th>
                                <th className="text-right py-3 px-4 font-semibold text-foreground">
                                    <Skeleton className="h-5 w-20" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: ROWS }).map((_, i) => (
                                <tr
                                    key={i}
                                    className="border-b border-border last:border-b-0"
                                >
                                    <td className="py-4 px-4">
                                        <Skeleton className="h-5 w-32" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <Skeleton className="h-5 w-20" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <Skeleton className="h-5 w-8 mx-auto" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <Skeleton className="h-5 w-24" />
                                    </td>
                                    <td className="py-4 px-4">
                                        <div className="flex justify-end gap-2">
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                            <Skeleton className="h-8 w-8 rounded-md" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    );
}

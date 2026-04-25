"use client";

import { Briefcase, Users } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export type LoginType = "business-owner" | "business-member";

interface LoginTypeSelectionModalProps {
    open: boolean;
    onSelect: (type: LoginType) => void;
}

export function LoginTypeSelectionModal({
    open,
    onSelect,
}: LoginTypeSelectionModalProps) {
    return (
        <Dialog open={open}>
            <DialogContent
                showCloseButton={false}
                className="sm:max-w-2xl"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                onInteractOutside={(e) => e.preventDefault()}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <DialogHeader className="items-center text-center sm:text-center">
                    <DialogTitle className="text-2xl font-bold">
                        ¿Cómo desea iniciar sesión?
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Seleccione su tipo de acceso para continuar.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-2">
                    <button
                        type="button"
                        onClick={() => onSelect("business-owner")}
                        className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center shadow-sm transition-all duration-500 ease-out hover:border-primary hover:shadow-lg focus-visible:border-primary focus-visible:outline-none dark:hover:shadow-[0_0_24px_rgba(34,197,94,0.45)]"
                    >
                        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/business-owner.svg"
                                alt="Dueño de Negocio"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <Briefcase className="h-6 w-6 text-primary" />
                        <h3 className="text-base font-semibold text-card-foreground">
                            Dueño de Negocio
                        </h3>
                        <p className="text-sm text-muted-foreground dark:text-neutral-300">
                            Gestión completa, facturación y control de equipos.
                        </p>
                    </button>

                    <button
                        type="button"
                        onClick={() => onSelect("business-member")}
                        className="group flex cursor-pointer flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 text-center shadow-sm transition-all duration-500 ease-out hover:border-primary hover:shadow-lg focus-visible:border-primary focus-visible:outline-none dark:hover:shadow-[0_0_24px_rgba(34,197,94,0.45)]"
                    >
                        <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-lg bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src="/business-member.svg"
                                alt="Miembro de Negocio"
                                className="h-full w-full object-contain"
                            />
                        </div>
                        <Users className="h-6 w-6 text-primary" />
                        <h3 className="text-base font-semibold text-card-foreground">
                            Miembro de Negocio
                        </h3>
                        <p className="text-sm text-muted-foreground dark:text-neutral-300">
                            Acceso a tareas, comunicación interna y reportes diarios.
                        </p>
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

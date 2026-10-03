"use client";

import { useState } from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  buildContactsPayload,
  CONTACT_LABEL_MAX_LENGTH,
  type ContactDraft,
  contactsErrorMessage,
  formatContactPhone,
  LICENSE_CONTACTS_MAX,
  validateContactDrafts,
} from "@/lib/desktop-licenses";
import {
  useGetDesktopLicenseContactsQuery,
  useUpdateDesktopLicenseContactsMutation,
} from "@/hooks/use-desktop-licenses";
import type { DesktopLicenseContact } from "@/lib/types/desktop-licenses";

const TITLE = "Números de WhatsApp para pagos";
const SAVE_ERROR_FALLBACK =
  "No se pudieron guardar los números. Intenta de nuevo.";

function NoContactsWarning() {
  return (
    <p className="flex items-start gap-1.5 text-sm text-amber-600 dark:text-amber-400">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      Sin números, los clientes no sabrán a quién escribir.
    </p>
  );
}

/**
 * Formulario del diálogo. Se monta al abrirlo, así el borrador arranca siempre
 * de la lista guardada. "Guardar" manda la lista entera, en el orden de las
 * filas.
 */
function ContactsForm({
  contacts,
  onSaved,
}: {
  contacts: DesktopLicenseContact[];
  onSaved: () => void;
}) {
  const [drafts, setDrafts] = useState<ContactDraft[]>(() =>
    contacts.map(({ phone, label }) => ({
      phone: formatContactPhone(phone),
      label: label ?? "",
    })),
  );
  /** Los errores de las filas se pintan desde el primer intento de guardar. */
  const [showErrors, setShowErrors] = useState(false);
  const updateMutation = useUpdateDesktopLicenseContactsMutation();
  const isPending = updateMutation.isPending;
  const errors = validateContactDrafts(drafts);

  function updateDraft(index: number, changes: Partial<ContactDraft>) {
    setDrafts((current) =>
      current.map((draft, i) => (i === index ? { ...draft, ...changes } : draft)),
    );
  }

  function moveDraft(index: number, offset: -1 | 1) {
    setDrafts((current) => {
      const next = [...current];
      [next[index], next[index + offset]] = [next[index + offset], next[index]];
      return next;
    });
  }

  async function handleSave() {
    if (errors.some(Boolean)) {
      setShowErrors(true);
      return;
    }
    try {
      await updateMutation.mutateAsync(buildContactsPayload(drafts));
      toastSuccess({
        title: "Números guardados",
        description:
          "Las instalaciones los reciben la próxima vez que se conectan a internet.",
      });
      onSaved();
    } catch (error) {
      toastError({
        title: "Error",
        description: contactsErrorMessage(error, SAVE_ERROR_FALLBACK),
      });
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        handleSave();
      }}
      className="flex flex-col gap-5 pt-2"
    >
      {drafts.length === 0 ? (
        <NoContactsWarning />
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((draft, index) => {
            const error = showErrors ? errors[index] : null;
            return (
              // Las filas no guardan estado propio: el índice vale como key.
              <li key={index} className="flex flex-col gap-1">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="tel"
                    aria-label={`Número ${index + 1}`}
                    placeholder="+53 5 5555555"
                    autoComplete="off"
                    className="sm:w-44"
                    value={draft.phone}
                    onChange={(e) => updateDraft(index, { phone: e.target.value })}
                    aria-invalid={error ? "true" : "false"}
                  />
                  <div className="flex flex-1 items-center gap-1">
                    <Input
                      aria-label={`Etiqueta del número ${index + 1}`}
                      placeholder="Etiqueta (opcional)"
                      autoComplete="off"
                      maxLength={CONTACT_LABEL_MAX_LENGTH}
                      className="flex-1"
                      value={draft.label}
                      onChange={(e) => updateDraft(index, { label: e.target.value })}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Subir el número ${index + 1}`}
                      disabled={index === 0}
                      onClick={() => moveDraft(index, -1)}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Bajar el número ${index + 1}`}
                      disabled={index === drafts.length - 1}
                      onClick={() => moveDraft(index, 1)}
                    >
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Quitar el número ${index + 1}`}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() =>
                        setDrafts((current) => current.filter((_, i) => i !== index))
                      }
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                {error ? <p className="text-xs text-destructive">{error}</p> : null}
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={drafts.length >= LICENSE_CONTACTS_MAX}
          onClick={() =>
            setDrafts((current) => [...current, { phone: "", label: "" }])
          }
        >
          <Plus className="size-4" />
          Añadir número
        </Button>
        <p className="text-xs text-muted-foreground">
          Con el código del país, por ejemplo +53. Máximo {LICENSE_CONTACTS_MAX}.
        </p>
      </div>

      {updateMutation.isError && (
        <p className="text-sm text-destructive">
          {contactsErrorMessage(updateMutation.error, SAVE_ERROR_FALLBACK)}
        </p>
      )}

      <Separator />

      <DialogFooter className="gap-2 sm:gap-2">
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isPending}>
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {isPending ? "Guardando..." : "Guardar"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Números de WhatsApp a los que escriben los clientes del escritorio para pagar
 * o renovar. Compacta a propósito: lo principal de la pantalla es la tabla de
 * instalaciones, así que la edición va en un diálogo.
 */
export function PaymentContactsCard() {
  const [open, setOpen] = useState(false);
  const { data: contacts, isError } = useGetDesktopLicenseContactsQuery();

  return (
    <Card className="py-4">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
            <MessageCircle className="size-4 text-primary" />
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <CardTitle className="text-card-foreground">{TITLE}</CardTitle>
            {!contacts ? (
              isError ? (
                <p className="text-sm text-destructive">
                  Error al cargar los números.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Cargando números…
                </p>
              )
            ) : contacts.length === 0 ? (
              <NoContactsWarning />
            ) : (
              <ul className="flex flex-wrap gap-2">
                {contacts.map((contact) => (
                  <li
                    key={contact.id}
                    className="flex items-baseline gap-1.5 rounded-md border border-border bg-muted/30 px-2 py-1 text-sm"
                  >
                    <span className="font-medium tabular-nums text-foreground">
                      {formatContactPhone(contact.phone)}
                    </span>
                    {contact.label ? (
                      <span className="text-muted-foreground">
                        {contact.label}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start sm:self-auto"
              disabled={!contacts}
            >
              <Pencil className="size-4" />
              Editar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] md:max-w-[560px] shadow-lg shadow-cyan-300/30">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">{TITLE}</DialogTitle>
              <DialogDescription>
                A estos números escriben los clientes de la app de escritorio
                para pagar o renovar su licencia. Las instalaciones los reciben
                la próxima vez que se conectan a internet.
              </DialogDescription>
            </DialogHeader>
            {contacts ? (
              <ContactsForm contacts={contacts} onSaved={() => setOpen(false)} />
            ) : null}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

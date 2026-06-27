"use client";

import * as React from "react";
import {
  CheckCircle2,
  ChevronDown,
  Loader2,
  Play,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { allSuites } from "@/testing/registry";
import {
  runSuites,
  type RunSummary,
  type SuiteResult,
  type TestResult,
} from "@/testing/run-suites";

const fmtMs = (ms: number) =>
  ms < 1 ? "<1 ms" : `${ms.toFixed(ms < 10 ? 1 : 0)} ms`;

/** Ejecuta las suites de lógica pura en el navegador y muestra los resultados. */
export function TestRunner() {
  const [summary, setSummary] = React.useState<RunSummary | null>(null);
  const [running, setRunning] = React.useState(false);

  const run = React.useCallback(() => {
    setRunning(true);
    // Diferimos un tick para que el spinner pinte antes del run (síncrono).
    setTimeout(() => {
      setSummary(runSuites(allSuites));
      setRunning(false);
    }, 0);
  }, []);

  // Corre automáticamente al abrir la vista.
  React.useEffect(() => {
    run();
  }, [run]);

  const allGreen = summary != null && summary.totalFailed === 0;

  return (
    <div className="flex min-w-0 max-w-full flex-col gap-6 overflow-x-hidden p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Test del sistema
          </h1>
          <p className="text-muted-foreground">
            Ejecuta las suites de lógica pura (moneda, stock, gates) en vivo y
            revisa sus resultados.
          </p>
        </div>
        <Button onClick={run} disabled={running}>
          {running ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Play />
          )}
          {running ? "Ejecutando…" : "Ejecutar tests"}
        </Button>
      </div>

      {summary && <SummaryBar summary={summary} allGreen={allGreen} />}

      <div className="flex flex-col gap-4">
        {summary?.suites.map((suite) => (
          <SuiteCard key={suite.name} suite={suite} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Estas suites también corren en terminal con{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono">pnpm test</code>
        . Los tests que necesiten servidor, mocks o navegador (componentes) se
        ejecutan solo ahí, no aquí.
      </p>
    </div>
  );
}

function SummaryBar({
  summary,
  allGreen,
}: {
  summary: RunSummary;
  allGreen: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-lg border p-4",
        allGreen
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-destructive/30 bg-destructive/5",
      )}
    >
      <div className="flex items-center gap-2">
        {allGreen ? (
          <CheckCircle2 className="size-5 text-emerald-600" />
        ) : (
          <XCircle className="size-5 text-destructive" />
        )}
        <span className="font-semibold text-foreground">
          {allGreen
            ? "Todos los tests pasaron"
            : `${summary.totalFailed} test(s) fallando`}
        </span>
      </div>
      <Separator />
      <Badge variant="outline">{summary.totalTests} totales</Badge>
      <Badge className="bg-emerald-600 text-white">
        {summary.totalPassed} pasados
      </Badge>
      {summary.totalFailed > 0 && (
        <Badge variant="destructive">{summary.totalFailed} fallidos</Badge>
      )}
      <Badge variant="secondary">{fmtMs(summary.durationMs)}</Badge>
    </div>
  );
}

function SuiteCard({ suite }: { suite: SuiteResult }) {
  const failed = suite.failed > 0;
  // Las suites con fallos arrancan expandidas; las verdes, colapsadas.
  const [open, setOpen] = React.useState(failed);

  React.useEffect(() => setOpen(failed), [failed]);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50"
      >
        {failed ? (
          <XCircle className="size-4 shrink-0 text-destructive" />
        ) : (
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-foreground">
            {suite.name}
          </div>
          {suite.description && (
            <div className="truncate text-xs text-muted-foreground">
              {suite.description}
            </div>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {suite.passed}/{suite.tests.length}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {suite.tests.map((test) => (
            <TestRow key={test.name} test={test} />
          ))}
        </ul>
      )}
    </div>
  );
}

function TestRow({ test }: { test: TestResult }) {
  const [open, setOpen] = React.useState(false);
  const passed = test.status === "passed";

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted/50"
      >
        {passed ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
        ) : (
          <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        )}
        <span className="min-w-0 flex-1 text-foreground">{test.name}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {fmtMs(test.durationMs)}
        </span>
        <ChevronDown
          className={cn(
            "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="space-y-2 px-4 pb-3 pl-11 text-sm">
          <p className="text-muted-foreground">
            {test.details ?? "Sin descripción detallada para este caso."}
          </p>
          {test.error && (
            <div>
              <span className="text-xs font-medium text-destructive">
                Error:
              </span>
              <pre className="mt-1 overflow-x-auto whitespace-pre-wrap rounded bg-destructive/10 px-2 py-1 font-mono text-xs text-destructive">
                {test.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function Separator() {
  return <span className="hidden h-5 w-px bg-border sm:block" />;
}

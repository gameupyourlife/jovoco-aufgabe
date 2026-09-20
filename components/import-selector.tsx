"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type ImportRunOption = {
  id: number;
  label: string;
};

export function ImportSelector({ runs, selectedRunId }: { runs: ImportRunOption[]; selectedRunId: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleChange(value: string | null) {
    if (!value) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("run", value);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <Select value={String(selectedRunId)} onValueChange={handleChange}>
      <SelectTrigger aria-label="Import auswählen" className="w-full sm:w-80">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {runs.map((run) => (
          <SelectItem key={run.id} value={String(run.id)}>{run.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
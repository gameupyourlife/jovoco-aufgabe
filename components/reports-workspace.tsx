"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { ReportData } from "@/lib/data/reports";

const chartConfig = {
  count: { label: "Ausleihen", color: "var(--chart-2)" },
  utilization: { label: "Auslastung", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function ReportsWorkspace({ data }: { data: ReportData }) {
  return <div className="grid gap-6 lg:grid-cols-2">
    <Card>
      <CardHeader><CardTitle>Aktuell meist ausgeliehen</CardTitle><CardDescription>Offene Ausleihen nach Person.</CardDescription></CardHeader>
      <CardContent>{data.currentBorrowers.length === 0 ? <p className="text-sm text-muted-foreground">Keine offenen Ausleihen.</p> : <ChartContainer config={chartConfig} className="h-72 w-full"><BarChart accessibilityLayer data={data.currentBorrowers} layout="vertical" margin={{ left: 12, right: 12 }}><CartesianGrid horizontal={false} /><YAxis dataKey="borrower" type="category" tickLine={false} axisLine={false} width={100} /><XAxis type="number" allowDecimals={false} hide /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--color-count)" radius={4} /></BarChart></ChartContainer>}</CardContent>
    </Card>

    <Card>
      <CardHeader><CardTitle>Am häufigsten verliehen</CardTitle><CardDescription>Historische Ausleihen je Gerät.</CardDescription></CardHeader>
      <CardContent>{data.popularDevices.length === 0 ? <p className="text-sm text-muted-foreground">Noch keine Ausleihen.</p> : <ChartContainer config={chartConfig} className="h-72 w-full"><BarChart accessibilityLayer data={data.popularDevices} margin={{ left: 8, right: 8, bottom: 35 }}><CartesianGrid vertical={false} /><XAxis dataKey="inventoryNumber" tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={55} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} width={30} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--color-count)" radius={4} /></BarChart></ChartContainer>}</CardContent>
    </Card>

    <Card className="lg:col-span-2">
      <CardHeader><CardTitle>Auslastung je Kategorie</CardTitle><CardDescription>Offene Ausleihen geteilt durch aktive Einheiten. Ausgemusterte Geräte werden nicht eingerechnet.</CardDescription></CardHeader>
      <CardContent>{data.categoryUtilization.length === 0 ? <p className="text-sm text-muted-foreground">Keine Kategorien vorhanden.</p> : <ChartContainer config={chartConfig} className="h-80 w-full"><BarChart accessibilityLayer data={data.categoryUtilization} margin={{ left: 8, right: 8, bottom: 30 }}><CartesianGrid vertical={false} /><XAxis dataKey="category" tickLine={false} axisLine={false} angle={-25} textAnchor="end" height={50} /><YAxis unit="%" domain={[0, 100]} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent formatter={(value) => `${value}%`} />} /><Bar dataKey="utilization" fill="var(--color-utilization)" radius={4} /></BarChart></ChartContainer>}</CardContent>
    </Card>
  </div>;
}

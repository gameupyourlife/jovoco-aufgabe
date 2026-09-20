"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import { createDevice, retireDevice, updateDevice, type DeviceInput } from "@/lib/actions/devices";
import { ActionMessage } from "@/components/action-message";
import { DeviceManagementForm } from "@/components/device-management-form";
import { DeviceManagementTable } from "@/components/device-management-table";
import type { Device } from "@/lib/data/inventory";

const emptyForm: DeviceInput = { name: "", inventoryNumber: "", category: "", quantity: 1, acquiredAt: new Date().toISOString().slice(0, 10) };

type Props = { devices: Device[] };

export function DeviceManagement({ devices }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<DeviceInput>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [search, setSearch] = useState("");

  const filteredDevices = useMemo(() => devices.filter((device) => `${device.name} ${device.inventoryNumber} ${device.category}`.toLowerCase().includes(search.toLowerCase())), [devices, search]);

  function editDevice(device: Device) {
    setEditingId(device.id);
    setForm({ name: device.name, inventoryNumber: device.inventoryNumber, category: device.category, quantity: device.quantity, acquiredAt: device.acquiredAt });
    setMessage(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage(null);
    const result = editingId === null ? await createDevice(form) : await updateDevice(editingId, form);
    setPending(false);
    if (!result.success) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "success", text: editingId === null ? "Gerät angelegt." : "Gerät gespeichert." });
    resetForm();
    router.refresh();
  }

  async function retire(deviceId: number) {
    setPending(true);
    setMessage(null);
    const result = await retireDevice(deviceId);
    setPending(false);
    setMessage({ type: result.success ? "success" : "error", text: result.success ? "Gerät ausgemustert." : result.error });
    if (result.success) router.refresh();
  }

  return <div className="flex flex-col gap-6">
    {message && <ActionMessage message={message} icon={<CheckCircle2 />} />}
    <DeviceManagementForm
      form={form}
      editing={editingId !== null}
      pending={pending}
      onChange={(field, value) => setForm((current) => ({ ...current, [field]: value }))}
      onSubmit={submit}
      onReset={resetForm}
    />
    <DeviceManagementTable
      devices={filteredDevices}
      search={search}
      pending={pending}
      onSearchChange={setSearch}
      onEdit={editDevice}
      onRetire={retire}
    />
  </div>;
}

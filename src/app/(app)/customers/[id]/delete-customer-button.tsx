"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCustomer, toggleCustomerActive } from "../actions";

export function ToggleActiveButton({
  customerId,
  isActive,
}: {
  customerId: string;
  isActive: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleCustomerActive(customerId, !isActive);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <button onClick={handleClick} disabled={isPending} className="text-xs font-medium text-muted disabled:opacity-50">
      {isActive ? "Deactivate" : "Activate"}
    </button>
  );
}

export function DeleteCustomerButton({
  customerId,
  customerName,
}: {
  customerId: string;
  customerName: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!window.confirm(`Delete ${customerName}? This can't be undone. Are you sure?`)) return;
    startTransition(async () => {
      const result = await deleteCustomer(customerId);
      if (result.error) {
        window.alert(result.error);
        return;
      }
      router.push("/customers");
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-medium text-danger disabled:opacity-50"
    >
      Delete
    </button>
  );
}

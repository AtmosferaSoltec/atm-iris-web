"use client";

import { Check, CircleHelp, Minus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PERMISSION_LABELS,
  PERMISSIONS,
  ROLE_LABELS,
  ROLE_PERMISSIONS,
  ROLES,
} from "@/lib/permissions";

/** "¿Qué puede hacer cada rol?", built from the same table the contract defines (§3). */
export function RolesPopover() {
  return (
    <Popover>
      <PopoverTrigger className="inline-flex cursor-pointer items-center gap-1.5 rounded-full text-sm font-semibold text-ink-2 transition hover:text-ink">
        <CircleHelp aria-hidden className="size-4" />
        ¿Qué puede hacer cada rol?
      </PopoverTrigger>
      <PopoverContent className="w-[min(560px,calc(100vw-2rem))] p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">Permisos de cada rol</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="px-4 py-3 font-medium text-ink-2">
                  Permite
                </th>
                {ROLES.map((role) => (
                  <th key={role} scope="col" className="px-3 py-3 text-center font-semibold">
                    {ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              <tr>
                <th scope="row" className="px-4 py-2.5 font-normal">
                  Ver todo lo de la iglesia
                </th>
                {ROLES.map((role) => (
                  <td key={role} className="px-3 py-2.5 text-center">
                    <Check aria-label="Sí" className="mx-auto size-4 text-success" />
                  </td>
                ))}
              </tr>
              {PERMISSIONS.map((permission) => (
                <tr key={permission}>
                  <th scope="row" className="px-4 py-2.5 font-normal">
                    {PERMISSION_LABELS[permission]}
                  </th>
                  {ROLES.map((role) => (
                    <td key={role} className="px-3 py-2.5 text-center">
                      {ROLE_PERMISSIONS[role].includes(permission) ? (
                        <Check aria-label="Sí" className="mx-auto size-4 text-success" />
                      ) : (
                        <Minus aria-label="No" className="mx-auto size-4 text-ink-3" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-4 py-3 text-xs text-ink-2">
          Solo un dueño puede asignar o quitar el rol de dueño.
        </p>
      </PopoverContent>
    </Popover>
  );
}

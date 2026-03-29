import { defectCodeRegistry } from "@/lib/ai/defectCodes";

export const defectCodeMeta = Object.fromEntries(
  Object.values(defectCodeRegistry).map((definition) => [
    definition.code,
    {
      label: definition.title,
      description: definition.description,
    },
  ]),
);

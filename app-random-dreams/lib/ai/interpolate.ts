export function interpolateTemplate(
  template: string,
  formData: Record<string, unknown>
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    if (!(key in formData) || formData[key] === undefined || formData[key] === null) {
      throw new Error(`Plantilla: placeholder {${key}} sin valor en form_data`);
    }
    const value = formData[key];
    return Array.isArray(value) ? value.join(", ") : String(value);
  });
}

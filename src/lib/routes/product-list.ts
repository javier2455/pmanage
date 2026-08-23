import { BASIC_ROUTE } from ".";

export const productListRoutes = {
  preview: `${BASIC_ROUTE}/product-list/preview`,
  send: `${BASIC_ROUTE}/product-list/send`,
  recipients: `${BASIC_ROUTE}/product-list/recipients`,
  currencies: `${BASIC_ROUTE}/product-list/currencies`,
  templates: `${BASIC_ROUTE}/product-list/templates`,
  template: (templateId: string) =>
    `${BASIC_ROUTE}/product-list/templates/${templateId}`,
};
